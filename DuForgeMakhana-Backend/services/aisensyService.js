// services/aisensyService.js

const AISENSY_API_URL = "https://backend.aisensy.com/campaign/t1/api/v2";

const parseJsonSafe = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const normalizeDestination = (phone) => {
  let p = String(phone || "").trim();

  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("0")) p = p.slice(1);

  if (p.startsWith("91") && p.length === 12) return p;
  if (/^\d{10}$/.test(p)) return `91${p}`;

  throw new Error("Invalid Indian phone number");
};

export const sendAiSensyOtp = async ({ phone, otp, name = "Customer" }) => {
  if (!process.env.AISENSY_API_KEY) {
    throw new Error("AISENSY_API_KEY is missing");
  }

  if (!process.env.AISENSY_AUTH_CAMPAIGN_NAME) {
    throw new Error("AISENSY_AUTH_CAMPAIGN_NAME is missing");
  }

  const destination = normalizeDestination(phone);
  const code = String(otp).trim();

  const payload = {
    apiKey: process.env.AISENSY_API_KEY,
    campaignName: process.env.AISENSY_AUTH_CAMPAIGN_NAME,
    destination,
    userName: name,
    templateParams: [code],
    source: process.env.AISENSY_SOURCE || "website",
    media: {},
    buttons: [
      {
        type: "button",
        sub_type: "url",
        index: 0,
        parameters: [
          {
            type: "text",
            text: code,
          },
        ],
      },
    ],
    carouselCards: [],
    location: {},
    attributes: {},
    paramsFallbackValue: {},
  };

  console.log("[AiSensy] Sending OTP payload:", {
    campaignName: payload.campaignName,
    destination: payload.destination,
    userName: payload.userName,
    templateParams: payload.templateParams,
    buttons: payload.buttons,
    source: payload.source,
  });

  const response = await fetch(AISENSY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await parseJsonSafe(response);

  console.log("[AiSensy] Response status:", response.status);
  console.log("[AiSensy] Response data:", data);

  if (!response.ok) {
    throw new Error(data?.message || data?.error || "AiSensy request failed");
  }

  if (data?.success === false) {
    throw new Error(data?.message || "AiSensy OTP send failed");
  }

  return data;
};