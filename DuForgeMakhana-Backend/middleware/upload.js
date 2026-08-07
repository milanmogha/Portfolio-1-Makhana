import multer from 'multer';
import path from 'path';

// Store files under /uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:   (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `banner-${Date.now()}${ext}`);
  }
});

export const uploadBanner = multer({ storage });
