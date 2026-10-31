
import { Queue } from "bullmq";
import redisClient from "../configs/redis.js";

const emailQueue = new Queue("emailQueue", {
  connection: redisClient,
});

emailQueue.on("error", (error) => {
  console.error("Email queue error:", error.message);
});

export default emailQueue;
