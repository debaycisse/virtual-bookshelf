const redis = require('redis');

class RedisClient {
  constructor() {
    if (process.env.PROD) {
      this. redisClient = redis.createClient({
        socket: {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
        }
      });
    } else {
      this. redisClient = redis.createClient();
    }
    this.isAlive = false;

    this.redisClient.connect()
      .then(() => {
        this.isAlive = true;
        console.log(`Redis is connected`);
      })
      .catch((err) => {
        this.isAlive = false;
        console.log(`Redis could not connect`);
      })
  }

  isAvailable() {
    return this.isAlive;
  }
}

const redisClient = new RedisClient();

module.exports = redisClient;
