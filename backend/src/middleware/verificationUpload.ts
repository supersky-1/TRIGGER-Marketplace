import multer from "multer";
import path from "path";
import fs from "fs";

const verificationDir = path.join(__dirname, "../../private-uploads/verifications");
fs.mkdirSync(verificationDir, { recursive: true });

const allowedMimeByExtension = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".pdf", "application/pdf"],
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, verificationDir),
    filename: (_req, file, callback) => {
      const safeExtension = path.extname(file.originalname).toLowerCase();
      callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedMimeByExtension.get(extension) === file.mimetype) {
      callback(null, true);
      return;
    }
    callback(new Error("Upload a PDF or image file (jpeg, jpg, png, webp, gif)"));
  },
});

export default upload;
