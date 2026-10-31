
import { Worker } from "bullmq";
import Redis from "ioredis";
import sendEmail from "../utils/sendEmail.js";

const connection = new Redis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  }
);

const worker = new Worker(
  "emailQueue",
  async (job) => {
    const { email } = job.data;

    if (!email) {
      throw new Error("Email address is missing from job data");
    }

    console.log(`Sending email to ${email}`);

    await sendEmail(email);

    console.log(`Email sent successfully to ${email}`);
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed:`, error.message);
});

worker.on("error", (error) => {
  console.error("Worker error:", error.message);
});

export default worker;
