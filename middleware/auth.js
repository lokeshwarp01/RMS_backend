import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: "Authorization header missing" });

        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({ error: "Invalid authorization format" });
        }

        const token = parts[1];
        const secret = process.env.JWT_SECRET;
        if (!secret) return res.status(500).json({ error: "JWT_SECRET not configured" });

        const decoded = jwt.verify(token, secret);
        // attach user id & email
        req.user = { id: decoded.id, email: decoded.email };
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};
