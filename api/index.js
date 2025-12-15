import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "../routes/userroutes.js";
import mailRoutes from "../routes/mailroutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" })); // small bodies; attachments handled by multer

app.use("/api/user", userRoutes);
app.use("/api/mail", mailRoutes);
app.use("/health", (req, res) => {
    res.send("OK COOL")
})
const PORT = process.env.PORT || 5000;

async function start() {
    try {
        if (!process.env.MONGO_URI) throw new Error("MONGO_URI not set in .env");
        await mongoose.connect(process.env.MONGO_URI, {
            // options are defaults in Mongoose 7+
        });
        console.log("Connected to MongoDB");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start:", err.message);
        process.exit(1);
    }
}

start();
