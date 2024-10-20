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
      })
      .catch((err) => {
        this.isAlive = false;
        console.error(`Redis could not connect`);
        console.log(`detail: ${err.message}`);
      })
  }

  /**
   * Checks if the cache is ready to start taking query
   * 
   * @returns true if it is ready, otherwise false
   */
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

  /**
   * Looks value of a given key
   * 
   * @param {string} key - to lookup its value 
   * @returns a found value, otherwise null
   */
  async get(key) {
    try {
      const val = await this.redisClient.get(key);
      if (val) return val;
      else return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Deletes a key/value pair from the cache
   * 
   * @param {string} key - to the key/value pair to be deleted
   * @returns null, if operation failed
   */
  async del(key) {
    try {
      const isDeleted = await this.redisClient.del(key);
      if (!isDeleted) return null;
      return isDeleted;
    } catch (error) {
      return null;
    }
  }
}

const redisClient = new RedisClient();

module.exports = redisClient;
