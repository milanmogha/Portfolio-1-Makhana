import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    image: {
      data: {
        type: Buffer, // Image data as a buffer
        required: true,
      },
      contentType: {
        type: String, // Content type (e.g., image/jpeg)
        required: true,
      },
    },
    text: {
      type: String, // Optional text for the banner
      default: "",
    },
    link: {
      type: String, // URL the banner should navigate to
      required: false,
      default: '',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Banner", bannerSchema);
