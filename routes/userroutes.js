import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: "name, email, password required" });

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(400).json({ error: "Email already registered" });

        const hashed = await bcrypt.hash(password, 10);

        const user = await User.create({ name, email: email.toLowerCase(), password: hashed });
        return res.status(201).json({ message: "User registered" });
    } catch (err) {
        console.error("register:", err.message);
        return res.status(500).json({ error: "Server error" });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "email, password required" });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(400).json({ error: "Invalid credentials" });

        const payload = { id: user._id.toString(), email: user.email };
        const token = jwt.sign(payload, process.env.JWT_SECRET);

        return res.json({ token });
    } catch (err) {
        console.error("login:", err.message);
        return res.status(500).json({ error: "Server error" });
    }
});

// Get current user profile (without password)
router.get("/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ error: "User not found" });
        return res.json(user);
    } catch (err) {
        console.error("me:", err.message);
        return res.status(500).json({ error: "Server error" });
    }
});

// Update settings: only from_mail, app_password, provider
router.put("/settings", auth, async (req, res) => {
    try {
        const { from_mail, app_password, provider } = req.body;

        // Only allow these fields to be updated through this endpoint
        const update = {};
        if (typeof from_mail === "string") update.from_mail = from_mail;
        if (typeof app_password === "string") update.app_password = app_password;
        if (typeof provider === "string") update.provider = provider;

        // If trying to update nothing, return 400
        if (Object.keys(update).length === 0) {
            return res.status(400).json({ error: "No valid fields to update" });
        }

        const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select("-password");
        return res.json(user);
    } catch (err) {
        console.error("settings:", err.message);
        return res.status(500).json({ error: "Server error" });
    }
});

export default router;
