const { redisClient, isRedisConnected } = require("../services/redisClient");

// Function to get data from Redis (fallback to MongoDB if Redis fails)
async function getCache(key) {
    try {
        console.log(isRedisConnected());
        if (isRedisConnected()) {
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        }
    } catch (error) {
        console.error("Redis getCache failed, falling back to MongoDB");
        return null;
    }
    return null; // If Redis fails, return null so MongoDB is used
}

// Function to set data in Redis (ignore if Redis fails)
async function setCache(key, value, ttl = 86400) {
    console.log(isRedisConnected());
    try {
        if (isRedisConnected()) {
            await redisClient.setEx(key, ttl, JSON.stringify(value));
        }
    } catch (error) {
        console.error("Redis setCache failed, continuing with MongoDB");
        return null;
    }
    return null; // If Redis fails, return null so MongoDB is used
}

// Function to delete cache keys matching the pattern
const deleteCache = async (prefix) => {
    try {
        const keys = await redisClient.keys(`${prefix}*`); // Find all keys with this prefix
        if (keys.length > 0) {
            await redisClient.del(...keys); // Delete all matching keys
            console.log(`Deleted cache keys:`, keys);
        }
    } catch (err) {
        console.error("Error deleting cache keys:", err.message);
    }
};

module.exports = { getCache, setCache, deleteCache };