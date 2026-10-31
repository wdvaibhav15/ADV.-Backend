import redisClient from "../configs/redis.js"

const rateLimiter = async (req, res, next) => {
    const ip = req.ip
    const key = `rate_limit:${ip}`
    const requests = await redisClient.incr(key)

    // expiry time duration
    if(requests === 1){
        await redisClient.expire(key, 60)
    }

    const ttl = await redisClient.ttl(key)

    if(requests > 5){
        return res.status(429).json({
            message: "Too Many Requests",
            retryAfter: ttl
        })
    }

    next()
}

export default rateLimiter;