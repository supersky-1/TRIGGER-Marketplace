import { Router } from "express";
import {
  submitVerification,
  getPendingVerifications,
  getVerificationDocument,
  updateVerificationStatus,
} from "../controllers/verificationController";
import { protect, sellerOnly, adminOnly } from "../middleware/auth";
import upload from "../middleware/verificationUpload";

const router = Router();

// Seller submits documents
router.post(
  "/submit",
  protect,
  sellerOnly,
  upload.array("documents", 5),
  submitVerification
);

// Admin routes
router.get("/pending", protect, adminOnly, getPendingVerifications);
router.get("/:userId/documents/:documentIndex", protect, adminOnly, getVerificationDocument);
router.patch("/:userId", protect, adminOnly, updateVerificationStatus);

export default router;
