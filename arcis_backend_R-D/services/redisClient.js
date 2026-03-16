const redis = require("redis");

let redisConnected = false; // Track Redis connection status

const redisClient = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: process.env.REDIS_PORT || 6379,
        reconnectStrategy: (retries) => {
            console.log(`🔄 Redis Reconnect Attempt #${retries}`);
            return Math.min(retries * 100, 3000); // Exponential backoff (max 3s)
        }
    }
});

// Handle connection success
redisClient.on("connect", () => {
    redisConnected = true;
    console.log("✅ Redis Connected");
});

// Handle connection errors
redisClient.on("error", (err) => {
    redisConnected = false;
    console.error("❌ Redis Connection Error:", err);
});

// Handle disconnection event
redisClient.on("end", () => {
    redisConnected = false;
    console.warn("⚠️ Redis Disconnected!");
});

// Function to check Redis connection status dynamically
const isRedisConnected = () => redisConnected;

// Attempt to connect
// (async () => {
//     try {
//         await redisClient.connect();
//     } catch (err) {
//         console.error("❌ Redis Initial Connection Failed:", err);
//     }
// })();

module.exports = { redisClient, isRedisConnected };
