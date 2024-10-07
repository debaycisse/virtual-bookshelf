const mongoDbClient = require("../utils/mongo");
// const redisClient = require('../utils/redis');
const mime = require('mime-types');

class BookShelfServer{
  static async getServerState(req, res) {
    const isAvailableMongo = await mongoDbClient.isAvailable();
    // const isAvailableRdis = await redisClient.isAvailable();

    if (!isAvailableMongo) {
      return res.status(500).json({
        status: 'Server not available',
        detail: 'Mongo DB is not connected',
      });
    }
    // if (!isAvailableRdis) {
    //   return res.status(500).json({
    //     status: 'Server not available',
    //     detail: 'Redis server is not connected',
    //   });
    // }

    res.setHeader('Content-Type', mime.contentType('json'));
    return res.status(200).json({
      status: 'server is available',
    });
  }
}

module.exports = BookShelfServer;
