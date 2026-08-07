// backend/src/utils/emailService.js

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a login/signup OTP to the customer's email.
 * Throws on failure so the auth controller can surface an error to the client.
 */
export const sendOtpEmail = async (email, otp, name = '') => {
  const mailOptions = {
    from: `"Makhana E-Store" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${otp} is your Makhana E-Store verification code`,
    text: `Your Makhana E-Store verification code is ${otp}. It expires in 5 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;border:1px solid #e8e5dd;border-radius:14px;overflow:hidden;background:#ffffff;">
        <div style="background:linear-gradient(135deg,#2C1E14,#180F07);padding:26px 24px;text-align:center;">
          <h2 style="margin:0;color:#F0D38A;letter-spacing:0.5px;">Makhana E-Store</h2>
          <p style="margin:6px 0 0;color:#f7f0e6;opacity:0.85;font-size:13px;">Healthy snacks. Delivered.</p>
        </div>
        <div style="padding:28px 24px;text-align:center;color:#20231F;">
          <p style="margin:0 0 6px;font-size:15px;color:#6B7068;">
            ${name ? `Hi ${name},` : 'Hi there,'}
          </p>
          <p style="margin:0 0 18px;font-size:15px;color:#20231F;">
            Use this code to sign in to your account:
          </p>
          <div style="display:inline-block;padding:14px 26px;border-radius:12px;background:#F8F4EC;border:1px solid #E8E5DD;font-size:30px;font-weight:800;letter-spacing:8px;color:#7A4D24;">
            ${otp}
          </div>
          <p style="margin:20px 0 0;font-size:13px;color:#969B93;">
            This code expires in 5 minutes. If you didn't request it, you can safely ignore this email.
          </p>
        </div>
        <div style="background:#f4f4f4;padding:14px;text-align:center;font-size:11px;color:#888;border-top:1px solid #eee;">
          &copy; ${new Date().getFullYear()} Makhana E-Store. All rights reserved.
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ OTP email sent to: ${email}`);
};

export const sendAdminOrderNotification = async (order) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;

    // 1. Format Date
    const orderDate = new Date(order.createdAt).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // 2. Format Address
    const addr = order.userAddress || {};
    const fullAddress = `
      ${addr.fullName || 'N/A'}<br/>
      ${addr.flat ? addr.flat + ',' : ''} ${addr.area || ''}<br/>
      ${addr.landmark ? 'Near ' + addr.landmark + '<br/>' : ''}
      ${addr.city || ''}, ${addr.state || ''} - ${addr.pincode || ''}<br/>
      <strong>Phone:</strong> ${addr.phone || 'N/A'}
    `;

    // 3. Calculate Totals for Transparency
    let totalMRP = 0;
    
    const productRows = order.products.map((item) => {
      const p = item.product;
      if (!p) return ''; // Skip deleted products

      // Calculate individual item math
      const mrp = p.price; 
      const discountPercent = p.discount || 0;
      const sellingPrice = Math.floor(mrp * (1 - discountPercent / 100)); // Match frontend logic
      
      // Add to total MRP calculation
      totalMRP += (mrp * item.quantity);

      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px;">
             <div style="font-weight:bold; color:#333;">${p.name}</div>
             <div style="font-size:12px; color:#888;">
               MRP: ₹${mrp.toLocaleString('en-IN')} 
               ${discountPercent > 0 ? `<span style="color:#d9534f;">(${discountPercent}% OFF)</span>` : ''}
             </div>
          </td>
          <td style="padding: 10px; text-align: center;">
             ${item.quantity}
          </td>
          <td style="padding: 10px; text-align: right; font-weight:bold;">
             ₹${(sellingPrice * item.quantity).toLocaleString('en-IN')}
          </td>
        </tr>
      `;
    }).join('');

    // 4. Calculate Deductions
    const itemsSellingTotal = order.paymentBreakdown.itemsTotal; 
    const productSavings = totalMRP - itemsSellingTotal; // Savings from product discounts
    const couponSavings = order.paymentBreakdown.discount || 0; // Savings from coupon
    const totalSavings = productSavings + couponSavings;

    // 5. Build Email HTML
    const mailOptions = {
      from: `"Makhana E-Store" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `🔔 New Order #${order.orderId} | Amount: ₹${order.paymentBreakdown.total}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color:#ffffff; border: 1px solid #e0e0e0;">
          
          <div style="background-color: #1F1B1A; color: #C9A66B; padding: 25px; text-align: center;">
            <h2 style="margin: 0; letter-spacing: 1px;">NEW ORDER RECEIVED</h2>
            <p style="margin: 5px 0 0 0; color: #fff; opacity: 0.9;">Order ID: ${order.orderId}</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #ccc;">${orderDate}</p>
          </div>

          <div style="padding: 25px;">
            
            <div style="display: flex; flex-wrap: wrap; margin-bottom: 25px; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px;">
              <div style="flex: 1; min-width: 200px; margin-bottom: 15px; padding-right: 10px;">
                <h4 style="color: #555; margin: 0 0 8px 0; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px;">Shipping To</h4>
                <p style="font-size: 14px; line-height: 1.6; color: #333; margin: 0;">
                  ${fullAddress}
                </p>
              </div>
              
              <div style="flex: 1; min-width: 200px; margin-bottom: 15px;">
                <h4 style="color: #555; margin: 0 0 8px 0; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px;">Payment Details</h4>
                <p style="font-size: 14px; line-height: 1.6; color: #333; margin: 0;">
                  <strong>Method:</strong> ${order.paymentMethod}<br/>
                  <strong>Status:</strong> ${order.status}<br/>
                  <strong>Coupon Used:</strong> ${order.couponCode ? `<span style="background:#e0f2f1; color:#00695c; padding:2px 6px; border-radius:4px;">${order.couponCode}</span>` : 'None'}
                </p>
              </div>
            </div>

            <h4 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 0;">Order Items</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f9f9f9; text-align: left; color: #666;">
                  <th style="padding: 10px; font-weight:600;">Product</th>
                  <th style="padding: 10px; text-align: center; font-weight:600;">Qty</th>
                  <th style="padding: 10px; text-align: right; font-weight:600;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${productRows}
              </tbody>
            </table>

            <div style="background-color: #fcfcfc; border: 1px solid #eee; border-radius: 8px; padding: 15px;">
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="color: #666; padding: 4px 0;">Total MRP</td>
                  <td style="text-align: right; color: #666;">₹${totalMRP.toLocaleString('en-IN')}</td>
                </tr>
                
                ${productSavings > 0 ? `
                <tr>
                  <td style="color: #2e7d32; padding: 4px 0;">Product Discount</td>
                  <td style="text-align: right; color: #2e7d32;">- ₹${productSavings.toLocaleString('en-IN')}</td>
                </tr>
                ` : ''}

                <tr>
                  <td style="color: #333; padding: 4px 0; font-weight:500;">Subtotal (Selling Price)</td>
                  <td style="text-align: right; color: #333; font-weight:500;">₹${itemsSellingTotal.toLocaleString('en-IN')}</td>
                </tr>

                <tr>
                  <td style="color: #666; padding: 4px 0;">Tax</td>
                  <td style="text-align: right; color: #666;">+ ₹${order.paymentBreakdown.tax.toLocaleString('en-IN')}</td>
                </tr>
                
                <tr>
                  <td style="color: #666; padding: 4px 0;">Shipping</td>
                  <td style="text-align: right; color: #666;">+ ₹${order.paymentBreakdown.shipping.toLocaleString('en-IN')}</td>
                </tr>

                ${couponSavings > 0 ? `
                <tr>
                  <td style="color: #2e7d32; padding: 4px 0; font-weight: bold;">Coupon Discount (${order.couponCode})</td>
                  <td style="text-align: right; color: #2e7d32; font-weight: bold;">- ₹${couponSavings.toLocaleString('en-IN')}</td>
                </tr>
                ` : ''}

                <tr style="border-top: 2px solid #eee;">
                  <td style="color: #000; padding: 12px 0 0 0; font-size: 18px; font-weight: 700;">Grand Total</td>
                  <td style="text-align: right; color: #000; padding: 12px 0 0 0; font-size: 18px; font-weight: 700;">₹${order.paymentBreakdown.total.toLocaleString('en-IN')}</td>
                </tr>
                
                ${totalSavings > 0 ? `
                <tr>
                  <td colspan="2" style="text-align: right; padding-top: 5px; font-size: 12px; color: #2e7d32;">
                    (Customer saved a total of ₹${totalSavings.toLocaleString('en-IN')} on this order)
                  </td>
                </tr>
                ` : ''}
              </table>
            </div>

          </div>

          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #ddd;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Makhana E-Store. All rights reserved.</p>
            <p style="margin: 2px 0;">This is an automated system email.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Invoice Email sent to admin: ${adminEmail}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
};