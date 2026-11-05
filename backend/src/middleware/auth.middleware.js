const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access token required"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.id)
            .select("_id role isActive");

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Account inactive or not found"
            });
        }

        req.user = {
            id: user._id.toString(),
            role: user.role
        };

        next();

    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token"
            });
        }

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Authentication error"
        });
    }
};

module.exports = authenticate;