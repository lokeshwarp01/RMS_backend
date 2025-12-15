import express from "express";
import multer from "multer";
import nodemailer from "nodemailer";
import User from "../models/user.js";
import { auth } from "../middleware/auth.js";
import { getSMTPConfig } from "../util/smtpconfig.js";

const router = express.Router();

// Use memory storage so files are available in `file.buffer`
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        // 10 MB per file (adjust if needed)
        fileSize: 10 * 1024 * 1024
    }
});

// /api/mail/send
router.post("/send", auth, upload.array("attachments", 5), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        if (!user.from_mail || !user.app_password || !user.provider) {
            return res.status(400).json({ error: "Email settings not configured. Please set from_mail, app_password and provider." });
        }

        const { recruiterEmail, subject, body } = req.body;
        if (!recruiterEmail || !subject) {
            return res.status(400).json({ error: "recruiterEmail and subject are required" });
        }

        const attachments = (req.files || []).map(f => ({
            filename: f.originalname,
            content: f.buffer
        }));

        // Prepare history entry
        const historyEntry = {
            recruiterEmail,
            subject,
            body: body || "",
            attachmentsCount: attachments.length,
            status: "failed",
            errorMessage: ""
            // sentAt will be added automatically by schema default when pushed
        };

        // Create transporter using user's stored config
        let smtpConfig;
        try {
            smtpConfig = getSMTPConfig(user.provider, user.from_mail, user.app_password);
        } catch (err) {
            historyEntry.errorMessage = err.message;
            user.mail_history.push(historyEntry);
            await user.save();
            return res.status(400).json({ error: err.message });
        }

        const transporter = nodemailer.createTransport(smtpConfig);

        // send mail
        try {
            const info = await transporter.sendMail({
                from: user.from_mail,
                to: recruiterEmail,
                subject,
                html: body || "",
                attachments
            });

            historyEntry.status = "success";
            historyEntry.errorMessage = "";

            user.mail_history.push(historyEntry);
            await user.save();

            return res.json({ message: "Email sent", messageId: info.messageId });
        } catch (err) {
            // Log error in history
            historyEntry.status = "failed";
            historyEntry.errorMessage = err.message || String(err);

            user.mail_history.push(historyEntry);
            await user.save();

            console.error("send mail error:", err);
            return res.status(500).json({ error: "Failed to send email", details: err.message || err });
        }
    } catch (err) {
        console.error("mail/send:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

// GET /api/mail/history
router.get("/history", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("mail_history");
        if (!user) return res.status(404).json({ error: "User not found" });
        return res.json(user.mail_history);
    } catch (err) {
        console.error("mail/history:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

export default router;
