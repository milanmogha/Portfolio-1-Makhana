import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
const FAST2SMS_SENDER_ID = process.env.FAST2SMS_SENDER_ID || "FSTSMS";

/**
 * Format Indian phone number to 10-digit
 */
const formatNumber = (number) => {
  let clean = number.replace(/[\s-]/g, "");

  if (clean.startsWith("+91")) clean = clean.slice(3);
  if (clean.startsWith("91") && clean.length === 12) clean = clean.slice(2);

  return clean;
};

/**
 * Send Order Status Update SMS via Fast2SMS
 */
export const sendOrderStatusSMS = async (phoneNumber, orderData, status) => {
  try {
    if (!FAST2SMS_API_KEY) {
      console.warn("⚠️ FAST2SMS_API_KEY missing in .env");
      return { success: false, message: "SMS config missing" };
    }

    const mobile = formatNumber(phoneNumber);

    let message = "";

    const normalizedStatus =
      status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    switch (normalizedStatus) {
      case "Confirmed":
        message = `Hi ${orderData.customerName}! Your order #${orderData.orderId} is CONFIRMED. Thank you for shopping with us.`;
        break;

      case "Shipped":
        message = orderData.trackingLink
          ? `Hi ${orderData.customerName}! Your order #${orderData.orderId} has been SHIPPED. Track here: ${orderData.trackingLink}`
          : `Hi ${orderData.customerName}! Your order #${orderData.orderId} has been SHIPPED.`;
        break;

      case "Delivered":
        message = `Hi ${orderData.customerName}! Your order #${orderData.orderId} has been DELIVERED. We hope you love it!`;
        break;

      case "Cancelled":
        message = `Hi ${orderData.customerName}, your order #${orderData.orderId} has been CANCELLED. If paid online, refund will be processed shortly.`;
        break;

      default:
        message = `Hi ${orderData.customerName}! Your order #${orderData.orderId} status: ${normalizedStatus}`;
    }

    const response = await axios.get("https://www.fast2sms.com/dev/bulkV2", {
      params: {
        authorization: FAST2SMS_API_KEY,
        route: "q",   // use "dlt" later if you enable DLT
        sender_id: FAST2SMS_SENDER_ID,
        message,
        numbers: mobile,
        flash: 0,
      },
    });

    console.log(`✅ Order status SMS sent to ${mobile}`, response.data);
    return { success: true, data: response.data };

  } catch (error) {
    console.error("❌ Fast2SMS Error:", error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

export default {
  sendOrderStatusSMS
};
