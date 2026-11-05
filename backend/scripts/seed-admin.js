require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../src/models/user.model");
const connectDB = require("../src/config/db");

const createAdmin = async () => {
    try {
        await connectDB();

        const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

        if (!ADMIN_NAME || !ADMIN_EMAIL ||
            !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
            throw new Error("Valid admin credentials required");
        }

        const existing = await User.findOne({
            email: ADMIN_EMAIL.toLowerCase()
        });

        if (existing) {
            console.log("Admin already exists");
            return;
        }

        const hashedPassword = await bcrypt.hash(
            ADMIN_PASSWORD,
            12
        );

        await User.create({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: "ADMIN"
        });

        console.log("Admin created successfully");

    } catch (error) {
        console.error(error);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
};

createAdmin();