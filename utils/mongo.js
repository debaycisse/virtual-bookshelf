require('dotenv').config();
const { MongoClient } = require('mongodb');

class MongoDBClient {
  constructor() {
    this.mongoClient = new MongoClient(process.env.DB_CON_STR_LOCAL);
    this.isConnected = false;
    this.mongoClient.connect()
      .then(() => {
        this.isConnected = true;
        this.db = this.mongoClient.db('bookShelves');
        console.log(`MongoDB is connected`);
      })
      .catch((err) => {
        this.isConnected = false;
        console.error('MongoDB could not connect : ', err);
      });
  }

  isAvailable() {
    return this.isConnected;
  }

  async userCollection() {
    const userCol = await this.db.collection('users');
    return userCol;
  }

  async shelfCollection() {
    const shelfCol = await this.db.collection('shelfs');
    return shelfCol;
  }

  async categoryCollection() {
    const categoryCol = await this.db.collection('categories');
    return categoryCol;
  }

  async bookCollection() {
    const bookCol = await this.db.collection('books');
    return bookCol;
  }

  async countDoc(parentId, docType) {
    try {
      let docTypeColletion;
      const filter = { parentId };
  
      if (docType === 'book') docTypeColletion = this.bookCollection();
      if (docType === 'category') docTypeColletion = this.categoryCollection();
      if (docType === 'shelve') docTypeColletion = this.shelfCollection();
  
      const nDoc = (await docTypeColletion).countDocuments(filter);
      return nDoc;
    } catch (error) {
      return 0;
    }
  }
}

const mongoDbClient = new MongoDBClient();

module.exports = mongoDbClient;
