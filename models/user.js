import mongoose from "mongoose";

const MailHistorySchema = new mongoose.Schema({
    recruiterEmail: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String },
    attachmentsCount: { type: Number, default: 0 },
    status: { type: String, enum: ["success", "failed"], required: true },
    errorMessage: { type: String, default: "" },
    sentAt: { type: Date, default: Date.now }
}, { _id: false });

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    // email sending configuration (user-manageable)
    from_mail: { type: String, default: "" },
    app_password: { type: String, default: "" }, // consider encrypting in production
    provider: { type: String, enum: ["gmail", "zoho", "outlook", "yahoo", ""], default: "" },

    // mail history logs per user
    mail_history: { type: [MailHistorySchema], default: [] }
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
