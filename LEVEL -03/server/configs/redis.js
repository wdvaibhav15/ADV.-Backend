// import Redis from "ioredis";

// const redisClient = new Redis(
//     process.env.REDIS_URL || "redis://127.0.0.1:6379",
//     {
//         retryStrategy(times) {
//             if (times > 5) {
//                 console.error("Redis connection failed after 5 retries");
//                 return null;
//             }

//             return Math.min(times * 1000, 5000);
//         }
//     }
// );

// redisClient.on("connect", () => {
//     console.log("Redis connected successfully");
// });

// redisClient.on("ready", () => {
//     console.log("Redis is ready");
// });

// redisClient.on("error", (error) => {
//     console.error("Redis connection error:", error.message);
// });

// export default redisClient;

import Redis from "ioredis";

const redisClient = new Redis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  }
);

redisClient.on("connect", () => {
  console.log("Redis connected successfully");
});

redisClient.on("ready", () => {
  console.log("Redis is ready");
});

redisClient.on("error", (error) => {
  console.error("Redis connection error:", error.message);
});

export default redisClient;
