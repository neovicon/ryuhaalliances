import express from "express";
import multer from "multer";
import { uploadFile, getSignedUrlForFile } from "../controllers/upload.controller.js";

const router = express.Router();

// Use memory storage to get the buffer directly
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", upload.single("file"), uploadFile);
router.get("/signed-url", getSignedUrlForFile);

export default router;
