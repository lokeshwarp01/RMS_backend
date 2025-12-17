import express from "express";
import multer from "multer";
import nodemailer from "nodemailer";
import User from "../models/user.js";
import { auth } from "../middleware/auth.js";
import { getSMTPConfig } from "../util/smtpconfig.js";

const router = express.Router();

// --------------------------------------------------
// Multer configuration (memory storage for attachments)
// --------------------------------------------------
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        // 10 MB per file
        fileSize: 10 * 1024 * 1024,
    },
});

// --------------------------------------------------
// POST /api/mail/send
// --------------------------------------------------
router.post(
    "/send",
    auth,
    upload.array("attachments", 5),
    async (req, res) => {
        try {
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            if (!user.from_mail || !user.app_password || !user.provider) {
                return res.status(400).json({
                    error:
                        "Email settings not configured. Please set from_mail, app_password and provider.",
                });
            }

            const { recruiterEmail, subject, body } = req.body;

            if (!recruiterEmail || !subject) {
                return res
                    .status(400)
                    .json({ error: "recruiterEmail and subject are required" });
            }

            // --------------------------------------------------
            // FORMAT EMAIL BODY (FIXES LINE BREAK ISSUE)
            // --------------------------------------------------
            const formattedBody = (body || "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\n/g, "<br/>");

            // --------------------------------------------------
            // Prepare attachments (memory buffer)
            // --------------------------------------------------
            const attachments = (req.files || []).map((file) => ({
                filename: file.originalname,
                content: file.buffer,
            }));

            // --------------------------------------------------
            // Prepare mail history entry
            // --------------------------------------------------
            const historyEntry = {
                recruiterEmail,
                subject,
                body: body || "",
                attachmentsCount: attachments.length,
                status: "failed",
                errorMessage: "",
            };

            // --------------------------------------------------
            // Create SMTP transporter
            // --------------------------------------------------
            let smtpConfig;
            try {
                smtpConfig = getSMTPConfig(
                    user.provider,
                    user.from_mail,
                    user.app_password
                );
            } catch (err) {
                historyEntry.errorMessage = err.message;
                user.mail_history.push(historyEntry);
                await user.save();
                return res.status(400).json({ error: err.message });
            }

            const transporter = nodemailer.createTransport(smtpConfig);

            // --------------------------------------------------
            // Send email
            // --------------------------------------------------
            try {
                const info = await transporter.sendMail({
                    from: user.from_mail,
                    to: recruiterEmail,
                    subject,
                    html: formattedBody,
                    attachments,
                });

                historyEntry.status = "success";
                historyEntry.errorMessage = "";

                user.mail_history.push(historyEntry);
                await user.save();

                return res.json({
                    message: "Email sent successfully",
                    messageId: info.messageId,
                });
            } catch (err) {
                historyEntry.status = "failed";
                historyEntry.errorMessage = err.message || String(err);

                user.mail_history.push(historyEntry);
                await user.save();

                console.error("Send mail error:", err);
                return res.status(500).json({
                    error: "Failed to send email",
                    details: err.message || err,
                });
            }
        } catch (err) {
            console.error("mail/send:", err);
            return res.status(500).json({ error: "Server error" });
        }
    }
);

// --------------------------------------------------
// GET /api/mail/history
// --------------------------------------------------

router.get("/history", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("mail_history");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.json(user.mail_history);
    } catch (err) {
        console.error("mail/history:", err);
        return res.status(500).json({ error: "Server error" });
    }
});

export default router;
