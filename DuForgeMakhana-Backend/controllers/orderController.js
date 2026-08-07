// /controllers/orderController.js

import mongoose from 'mongoose';
import { Order } from '../models/Orders.js';
import AddressBook from '../models/AddressBook.js';
import Coupon from '../models/Coupon.js';
import PDFDocument from 'pdfkit';
import Product from '../models/Product.js';
import { sendAdminOrderNotification } from '../utils/emailService.js';
import { sendOrderStatusSMS } from '../utils/smsService.js'; // ✅ Only order status SMS
import { createNotification } from './notificationController.js';
import shippingService from '../utils/shippingService.js';
import numberToWords from 'number-to-words'; // npm i number-to-words

// =================================================================
// 🛠️  Process & Save Order 
// =================================================================
export const processOrderCreation = async (orderData, userId, io) => {
  // 1. Validate the items list
  const items = (orderData.products || []).filter((it) => it && it.product);
  if (items.length === 0) {
    const err = new Error('Order must contain at least one product');
    err.status = 400;
    throw err;
  }
  for (const it of items) {
    if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 100) {
      const err = new Error('Invalid product quantity');
      err.status = 400;
      throw err;
    }
  }

  // 2. Recompute the canonical paymentBreakdown server-side. If this fails we
  //    abort — client-supplied totals are never trusted.
  const addr = await AddressBook.findById(orderData.userAddress);
  if (!addr) {
    const err = new Error('Delivery address not found');
    err.status = 400;
    throw err;
  }
  const serverCalc = await shippingService.calculateCharges({
    items,
    pincode: addr.pincode || '',
    couponCode: orderData.couponCode || null,
    userId,
  });
  orderData.paymentBreakdown = {
    itemsTotal: serverCalc.itemsTotal,
    tax: serverCalc.tax,
    shipping: serverCalc.shipping,
    discount: serverCalc.discount,
    total: serverCalc.total,
  };

  // 3. Reserve stock atomically; roll back partial reservations on failure
  const reserved = [];
  try {
    for (const item of items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) {
        const err = new Error('One or more items are out of stock');
        err.status = 409;
        throw err;
      }
      reserved.push(item);
    }
  } catch (stockErr) {
    for (const item of reserved) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }).catch(() => {});
    }
    throw stockErr;
  }

  try {
    const isPrepaid = String(orderData.paymentMethod || '').toLowerCase() !== 'cashondelivery';

    // 4. Create Order (orderId is generated collision-free by the model hook)
    const newOrder = await Order.create({
      ...orderData,
      products: items,
      user: userId,
      orderId: undefined,
      status: isPrepaid ? 'Confirmed' : 'Pending',
    });

    // 5. Update Coupon (only if the calculator actually honoured it)
    if (serverCalc.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: serverCalc.couponCode },
        {
          $inc: { usedCount: 1 },
          $addToSet: { usedBy: userId }
        }
      );
    }

    // 6. Load full order
    const populatedOrder = await Order.findById(newOrder._id)
      .populate('products.product')
      .populate('userAddress');

    // 7. Emit socket event
    if (io) {
      io.emit('order-placed', populatedOrder);
    }

    // 8. Email notification
    try {
      await sendAdminOrderNotification(populatedOrder);
    } catch (emailErr) {
      console.error('Failed to send email:', emailErr.message);
    }

    // 9. Admin web notification
    try {
      await createNotification({
        type: 'ORDER_PLACED',
        title: 'New Order Received',
        message: `Order ${orderId} has been placed. Payment: ${orderData.paymentMethod}`,
        orderId: newOrder._id,
        link: `/admin/orders/${newOrder._id}`,
        priority: 'high'
      });
    } catch (notifErr) {
      console.error('Failed to create notification:', notifErr.message);
    }

    return populatedOrder;

  } catch (error) {
    // Order creation failed after stock was reserved — release it
    for (const item of reserved) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } }).catch(() => {});
    }
    console.error('❌ Order creation failed:', error);
    throw error;
  }
};


// =================================================================
// 1) CREATE ORDER
// =================================================================
export const createOrder = async (req, res) => {
  try {
    const orderData = req.body;
    const userId = req.user.userId;

    // Customers can only place Cash-on-Delivery orders here; online payments
    // must go through /api/payment so the paid amount is verified.
    if (String(orderData.paymentMethod || '').toLowerCase() !== 'cashondelivery') {
      return res.status(400).json({ message: 'Use the payment flow for prepaid orders' });
    }

    const newOrder = await processOrderCreation(orderData, userId, req.io);

    res.status(201).json(newOrder);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Failed to create order' });
  }
};


// =================================================================
// 2) GET MY ORDERS
// =================================================================
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.userId;

    const orders = await Order.find({ user: userId })
      .populate({
        path: 'products.product',
        select: 'name price discount stock images.image1'
      })
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();

    const formattedOrders = orders.map(order => {
      if (order.products) {
        order.products = order.products.map(item => {
          if (item.product && item.product.images?.image1?.data) {
            const img = item.product.images.image1;
            item.product.imageUrl = `data:${img.contentType};base64,${img.data.toString('base64')}`;
            delete item.product.images;
          }
          return item;
        });
      }
      return order;
    });

    res.json(formattedOrders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};


// =================================================================
// 3) GET ORDER BY ID
// =================================================================
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { orderId: id };

    const order = await Order.findOne(query)
      .populate({
        path: 'products.product',
        select: 'name price discount stock images.image1'
      })
      .populate('userAddress')
      .lean();

    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.user !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (order.products) {
      order.products = order.products.map(item => {
        if (item.product && item.product.images?.image1?.data) {
          const img = item.product.images.image1;
          item.product.imageUrl = `data:${img.contentType};base64,${img.data.toString('base64')}`;
          delete item.product.images;
        }
        return item;
      });
    }

    res.json(order);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// =================================================================
// 4) GENERATE INVOICE (NO SMS HERE)
// =================================================================
export const generateOrderInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, user: req.user.userId })
      .populate('products.product')
      .populate('userAddress');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // --- Company Info ---
    const COMPANY = {
      name: 'Makhana E-Store',
      address: 'Plot 12, Industrial Area, Sector 21, Gurugram, Haryana, 122016, India',
      email: 'support@makhanahealthking.com',
      phone: '+91-9876543210',
      gstin: '06ABCDE1234F1Z5', // Dummy GSTIN
    };

    // --- Invoice Metadata ---
    const invoiceNumber = `INV-${order.orderId}`;
    const orderId = order.orderId;
    const invoiceDate = new Date().toLocaleDateString();
    const orderDate = new Date(order.createdAt).toLocaleDateString();
    const paymentMethod = order.paymentMethod ? order.paymentMethod.toUpperCase() : 'N/A';
    const orderStatus = order.status || 'N/A';

    // --- Billing & Shipping ---
    const billing = order.userAddress || {};
    const shipping = order.userAddress || {};

    // --- PDF Setup ---
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderId}.pdf`);
    doc.pipe(res);

    // --- Brand Header ---
    doc
      .rect(40, 40, 60, 60)
      .stroke()
      .fontSize(10)
      .text('Logo', 55, 70, { align: 'center', width: 30 });
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .text(COMPANY.name, 110, 50, { align: 'left' });
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(COMPANY.address, 110, 75, { align: 'left' })
      .text(`Email: ${COMPANY.email} | Phone: ${COMPANY.phone}`, 110, 90, { align: 'left' })
      .text(`GSTIN: ${COMPANY.gstin}`, 110, 105, { align: 'left' });

    doc.moveDown(2);

    // --- Invoice Metadata Section ---
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Invoice Details', { underline: true });
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Invoice Number: ${invoiceNumber}`)
      .text(`Order ID: ${orderId}`)
      .text(`Invoice Date: ${invoiceDate}`)
      .text(`Order Date: ${orderDate}`)
      .text(`Payment Method: ${paymentMethod}`)
      .text(`Order Status: ${orderStatus}`);

    doc.moveDown(1);

    // --- Billing & Shipping Section (Side-by-Side) ---
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Billing & Shipping', { underline: true });
    doc.moveDown(0.5);

    const leftX = 40, rightX = 300, yStart = doc.y;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Billing Address:', leftX, yStart)
      .font('Helvetica')
      .text(billing.fullName || '', leftX, doc.y)
      .text(`${billing.flat || ''}, ${billing.area || ''}`, leftX, doc.y)
      .text(`${billing.city || ''}, ${billing.state || ''} - ${billing.pincode || ''}`, leftX, doc.y)
      .text(`Phone: ${billing.phone || ''}`, leftX, doc.y);

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Shipping Address:', rightX, yStart)
      .font('Helvetica')
      .text(shipping.fullName || '', rightX, doc.y)
      .text(`${shipping.flat || ''}, ${shipping.area || ''}`, rightX, doc.y)
      .text(`${shipping.city || ''}, ${shipping.state || ''} - ${shipping.pincode || ''}`, rightX, doc.y)
      .text(`Phone: ${shipping.phone || ''}`, rightX, doc.y);

    doc.moveDown(2);

    // --- Product Table ---
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Order Items', { underline: true });
    doc.moveDown(0.5);

    // Table Header
    const tableTop = doc.y;
    const colWidths = [30, 120, 60, 40, 60, 50, 60, 60];
    const headers = [
      'Sr No', 'Product Name', 'SKU', 'Qty', 'Unit Price', 'Discount', 'Taxable Value', 'Line Total'
    ];
    let x = leftX;
    headers.forEach((header, i) => {
      doc.font('Helvetica-Bold').fontSize(9).text(header, x, tableTop, { width: colWidths[i], align: 'center' });
      x += colWidths[i];
    });
    doc.moveDown(0.5);
    doc.moveTo(leftX, doc.y).lineTo(550, doc.y).stroke();

    // Table Rows
    let srNo = 1;
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalTax = 0;
    let totalLine = 0;

    order.products.forEach(item => {
      if (item.product) {
        const sku = item.product.sku || 'SKU-NA';
        const qty = item.quantity;
        const unitPrice = item.product.price || 0;
        const discount = item.product.discount || 0;
        const taxableValue = unitPrice * qty - discount;
        const lineTotal = taxableValue; // Placeholder, add tax logic if needed

        subtotal += unitPrice * qty;
        totalDiscount += discount;
        totalTaxable += taxableValue;
        totalLine += lineTotal;

        let x = leftX;
        [
          srNo,
          item.product.name,
          sku,
          qty,
          `₹${unitPrice.toFixed(2)}`,
          `₹${discount.toFixed(2)}`,
          `₹${taxableValue.toFixed(2)}`,
          `₹${lineTotal.toFixed(2)}`
        ].forEach((val, i) => {
          doc.font('Helvetica').fontSize(9).text(val, x, doc.y, { width: colWidths[i], align: 'center' });
          x += colWidths[i];
        });
        srNo++;
        doc.moveDown(0.5);
      }
    });

    doc.moveTo(leftX, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // --- Tax & Charges Breakdown ---
    const pb = order.paymentBreakdown || {};
    const cgst = pb.tax ? pb.tax / 2 : 0;
    const sgst = pb.tax ? pb.tax / 2 : 0;
    const igst = 0; // Placeholder, add IGST logic if needed

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Charges & Tax Breakdown', { underline: true });
    doc.moveDown(0.5);

    const breakdownRows = [
      ['Subtotal', `₹${pb.itemsTotal?.toFixed(2) || subtotal.toFixed(2)}`],
      ['Discount', `₹${pb.discount?.toFixed(2) || totalDiscount.toFixed(2)}`],
      ['Shipping Charges', `₹${pb.shipping?.toFixed(2)}`],
      ['CGST', `₹${cgst.toFixed(2)}`],
      ['SGST', `₹${sgst.toFixed(2)}`],
      ['IGST', `₹${igst.toFixed(2)}`],
      ['Grand Total', `₹${pb.total?.toFixed(2)}`]
    ];

    breakdownRows.forEach(([label, value]) => {
      doc.font('Helvetica').fontSize(10).text(label, leftX + 250, doc.y, { width: 120, align: 'right' });
      doc.font('Helvetica-Bold').fontSize(10).text(value, leftX + 370, doc.y, { width: 100, align: 'right' });
      doc.moveDown(0.5);
    });

    doc.moveDown(1);

    // --- Amount in Words ---
    const amountNum = pb.total ? pb.total : totalLine;
    const amountWords = numberToWords.toWords(amountNum);
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(`Amount in Words: Rupees ${amountWords.charAt(0).toUpperCase() + amountWords.slice(1)} Only`, leftX, doc.y);

    doc.moveDown(2);

    // --- Footer Section ---
    doc
      .fontSize(9)
      .font('Helvetica')
      .text('Declaration: This is a system generated invoice.', leftX, doc.y)
      .moveDown(0.5)
      .font('Helvetica-Bold')
      .text('Authorized Signatory', leftX, doc.y)
      .moveDown(0.5)
      .font('Helvetica')
      .text('Thank you for shopping with Makhana E-Store!', leftX, doc.y);

    doc.end();

  } catch (err) {
    console.error('Invoice generation error:', err);
    res.status(500).json({ message: 'Failed to generate invoice' });
  }
};


// =================================================================
// 5) UPDATE ORDER STATUS (Admin with Smart SMS Logic)
// =================================================================
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingLink } = req.body;

    const ALLOWED_STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
    if (typeof status !== 'string' || !ALLOWED_STATUSES.some(s => s.toLowerCase() === status.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findById(id).populate('userAddress');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const normalizedStatus =
      status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    const updateData = { status: normalizedStatus };
    if (trackingLink !== undefined) {
      updateData.trackingLink = trackingLink;
    }

    let shouldSendSMS = false;
    let smsFlag = null;

    switch (normalizedStatus) {
      case 'Confirmed':
        if (!order.notificationFlags?.confirmed_sms_sent) {
          shouldSendSMS = true;
          smsFlag = 'notificationFlags.confirmed_sms_sent';
        }
        break;
      case 'Shipped':
        if (!order.notificationFlags?.shipped_sms_sent) {
          shouldSendSMS = true;
          smsFlag = 'notificationFlags.shipped_sms_sent';
        }
        break;
      case 'Delivered':
        if (!order.notificationFlags?.delivered_sms_sent) {
          shouldSendSMS = true;
          smsFlag = 'notificationFlags.delivered_sms_sent';
        }
        break;
      case 'Cancelled':
        if (!order.notificationFlags?.cancelled_sms_sent) {
          shouldSendSMS = true;
          smsFlag = 'notificationFlags.cancelled_sms_sent';
        }
        break;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('userAddress').populate('products.product');

    if (shouldSendSMS && smsFlag) {
      try {
        if (updatedOrder.userAddress?.phone) {
          await sendOrderStatusSMS(updatedOrder.userAddress.phone, {
            orderId: updatedOrder.orderId,
            customerName: updatedOrder.userAddress.fullName,
            trackingLink: normalizedStatus === 'Shipped' ? updatedOrder.trackingLink : null,
          }, normalizedStatus);

          await Order.findByIdAndUpdate(id, { [smsFlag]: true });
          console.log(`✅ SMS sent for ${normalizedStatus} status`);
        }
      } catch (smsErr) {
        console.error('Failed to send SMS notification:', smsErr.message);
      }
    }

    const finalOrder = await Order.findById(id)
      .populate('userAddress')
      .populate('products.product');

    const io = req.io;
    if (io) {
      io.emit('order-status-updated', {
        orderId: finalOrder._id,
        status: finalOrder.status,
        order: finalOrder
      });
    }

    res.json(finalOrder);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// =================================================================
// 6) GET ALL ORDERS (Admin)
// =================================================================
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({
        path: 'products.product',
        select: 'name price discount stock images.image1'
      })
      .populate('userAddress')
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();

    const formattedOrders = orders.map(order => {
      if (order.products) {
        order.products = order.products.map(item => {
          if (item.product && item.product.images?.image1?.data) {
            const img = item.product.images.image1;
            item.product.imageUrl = `data:${img.contentType};base64,${img.data.toString('base64')}`;
            delete item.product.images;
          }
          return item;
        });
      }
      return order;
    });

    res.json(formattedOrders);
  } catch(err) {
    res.status(500).json({message: err.message});
  }
};
