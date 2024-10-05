require('dotenv').config();
const { MongoClient } = require('mongodb');

class MongoDBClient {
  constructor() {
    this.mongoClient = new MongoClient(process.env.DB_CON_STR_LOCAL);
    this.isConnected = false;

    this.mongoClient.connect()
      .then(() => {
        this.isConnected = true;
        console.log(`MongoDB is connected`)
      })
      .catch((err) => {
        this.isConnected = false;
        console.error('MongoDB could not connect : ', err);
      });
  }

  isAvailable() {
    return this.isConnected;
  }
}

const mongoDbClient = new MongoDBClient();

module.exports = mongoDbClient;
