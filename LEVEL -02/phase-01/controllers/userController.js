
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import redisClient from "../configs/redis.js";
import sendEmail from "../utils/sendEmail.js";
import emailQueue from "../queues/queue.js";
// Create user
const createUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        // send mail using queue
        // await sendEmail();
        await emailQueue.add("sendEmail", { email });

        // Invalidate cache so newly created users appear immediately
        await redisClient.del("all_users");

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get users directly from MongoDB
const getUserData = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .lean();

        return res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            users
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get users using Redis cache
const getUserDataWithRedis = async (req, res) => {
    const cacheKey = "all_users";

    try {
        // 1. Check Redis cache
        const cachedUsers = await redisClient.get(cacheKey);

        if (cachedUsers !== null) {
            return res.status(200).json({
                success: true,
                message: "Users fetched from Redis cache",
                source: "Redis",
                users: JSON.parse(cachedUsers)
            });
        }
    } catch (error) {
        console.error("Redis cache read failed:", error.message);
    }

    try {
        // 2. Cache miss, fetch from MongoDB
        const users = await User.find()
            .select("-password")
            .lean();

        // 3. Store the result in Redis for 60 seconds
        try {
            await redisClient.set(
                cacheKey,
                JSON.stringify(users),
                "EX",
                60
            );
        } catch (error) {
            console.error("Redis cache write failed:", error.message);
        }

        return res.status(200).json({
            success: true,
            message: "Users fetched from MongoDB",
            source: "MongoDB",
            users
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch users"
        });
    }
};

export {
    createUser,
    getUserData,
    getUserDataWithRedis
};
