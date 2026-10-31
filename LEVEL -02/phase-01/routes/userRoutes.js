
import express from "express";

import {
    createUser,
    getUserData,
    getUserDataWithRedis
} from "../controllers/userController.js";
import rateLimiter from "../middlewares/ratelimit.js";

const userRouter = express.Router();

userRouter.post("/create", createUser);
userRouter.get("/get",rateLimiter, getUserData);
userRouter.get("/redis-get", getUserDataWithRedis);

export default userRouter;
