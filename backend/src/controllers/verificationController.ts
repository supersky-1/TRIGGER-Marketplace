import { Response } from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";
import { createNotification } from "./notificationController";

export const submitVerification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { businessName } = req.body;

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "Please upload at least one document" });
    }

    const documentPaths = files.map((file) => `private:${file.filename}`);

    const user = await User.findByIdAndUpdate(
      userId,
      {
        businessName: businessName || undefined,
        businessDocuments: documentPaths,
        verificationStatus: "pending",
        isVerified: false,
      },
      { returnDocument: "after" }
    ).select("-password");

    res.json({
      message: "Documents submitted successfully. Waiting for admin approval.",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getVerificationDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, documentIndex } = req.params;
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }
    const index = Number(documentIndex);
    if (!Number.isSafeInteger(index) || index < 0) {
      return res.status(400).json({ message: "Invalid document index" });
    }

    const seller = await User.findOne({ _id: userId, role: "seller" }).select("businessDocuments");
    if (!seller || !seller.businessDocuments || index >= seller.businessDocuments.length) {
      return res.status(404).json({ message: "Verification document not found" });
    }

    const documentReference = seller.businessDocuments[index];
    const isPrivateDocument = documentReference.startsWith("private:");
    const storedFilename = isPrivateDocument ? documentReference.slice("private:".length) : documentReference;
    const filename = path.basename(storedFilename);
    if (!filename || filename !== storedFilename.replace(/^.*[\\/]/, "")) {
      return res.status(404).json({ message: "Verification document not found" });
    }

    const directory = path.resolve(__dirname, isPrivateDocument ? "../../private-uploads/verifications" : "../../uploads");
    const filePath = path.resolve(directory, filename);
    if (!filePath.startsWith(`${directory}${path.sep}`) || !fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Verification document not found" });
    }

    return res.sendFile(filePath, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getPendingVerifications = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const pending = await User.find({
      role: "seller",
      verificationStatus: "pending",
    }).select("-password");

    res.json(pending);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateVerificationStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admins only" });
    }

    const { userId } = req.params;
    const targetUserId = Array.isArray(userId) ? userId[0] : userId;
    const { status, note } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await User.findByIdAndUpdate(
      targetUserId,
      {
        verificationStatus: status,
        isVerified: status === "approved",
        verificationNote: note || "",
      },
      { returnDocument: "after" }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send notification to the seller
    await createNotification(
      targetUserId,
      status === "approved" ? "Verification Approved 🎉" : "Verification Rejected",
      status === "approved"
        ? "Congratulations! Your seller account has been verified. You can now start selling."
        : "Your seller verification was rejected. Please contact support or resubmit your documents.",
      "verification",
      status === "approved" ? "/seller/dashboard" : "/seller/verification"
    );

    res.json({
      message: `Seller verification ${status}`,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
