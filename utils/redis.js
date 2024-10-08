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
        console.error(`Redis could not connect`);
        console.log(`detail: ${err.message}`);
      })
  }

  isAvailable() {
    return this.isAlive;
  }

  async storeJwt(userToken, jwt) {
    try {
      await this.redisClient.setEx(userToken, 60 * 60 * 24, jwt);
      return 'done';
    } catch (err) {
      return null;
    }
  }
}

const redisClient = new RedisClient();

module.exports = redisClient;
