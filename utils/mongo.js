require('dotenv').config();
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');

class MongoDBClient {
  constructor() {
    this.mongoClient = new MongoClient(process.env.DB_CON_STR_LOCAL);
    this.isConnected = false;
    this.mongoClient.connect()
      .then(() => {
        this.isConnected = true;
        this.db = this.mongoClient.db('bookShelves');
      })
      .catch((err) => {
        this.isConnected = false;
        console.error('MongoDB could not connect : ', err);
      });
  }

  /**
   * Checks if the database is ready to start accepting queries
   * @returns true if the database is ready, otherwise false
   */
  isAvailable() {
    return this.isConnected;
  }

  /**
   * Creates a user collection, if it does not exist
   * 
   * @returns a collection, named users
   */
  async userCollection() {
    const userCol = await this.db.collection('users');
    return userCol;
  }

  /**
   * Creates a bookshelf collection, if it does not exist
   * 
   * @returns a collection, named user shelfs
   */
  async bookshelfCollection() {
    const bookshelfCol = await this.db.collection('shelfs');
    return bookshelfCol;
  }

  /**
   * Creates a book category collection, if it does not exist
   * 
   * @returns a collection, named user categories
   */
  async categoryCollection() {
    const categoryCol = await this.db.collection('categories');
    return categoryCol;
  }

  /**
   * Creates a book collection, if it does not exist
   * 
   * @returns a collection, named books
   */
  async bookCollection() {
    const bookCol = await this.db.collection('books');
    return bookCol;
  }

  /**
   * Counts a total number of documents, using the parentId as a filter
   * 
   * @param {string} parentId - this is used as a filtering documents
   * @param {string} docType - a type document (i.e book, category, bookshelf)
   * @returns the number of documents that match up the filtering
   */
  async countDoc(parentId, docType) {
    try {
      let docTypeColletion;
      let numDoc;
      const filter = { parentId };
      const bookFilter = { bookshelfId: parentId };
      
      if (docType === 'book') docTypeColletion = await this
        .bookCollection();
      if (docType === 'category') docTypeColletion = await this
        .categoryCollection();
      if (docType === 'bookShelf') docTypeColletion = await this
        .bookshelfCollection();

      if (docType === 'book') {
        numDoc = docTypeColletion.countDocuments(bookFilter);
      }
      if (docType === 'bookShelf') {
        numDoc = docTypeColletion.countDocuments(filter);
      }
      if (docType === 'category') {
        numDoc = docTypeColletion.countDocuments(filter);
      }
      return numDoc;
      } catch (error) {
      return 0;
    }
  }

  /**
   * Verifies that a given document is valid and matches up its given type.
   * Example: if a docId is given with a docType 'book', then the ID must
   * exist in book collection
   * 
   * @param {*} docId - an ID to look up
   * @param {*} docType - the collection where to lookup the ID
   * @returns null if ID is not known to any document, otherwise
   * an ID of the found document
   */
  async verifyDocType(docId, docType) {
    let docCol;

    if (docType === 'bookshelf') docCol = await this.bookshelfCollection();
    if (docType === 'category') docCol = await this.categoryCollection();
    if (docType === 'user') docCol = await this.userCollection();
    if (docType === 'book') docCol = await this.bookCollection();
    try {
      const doc = await docCol.findOne({  _id: new ObjectId(docId) });
      if (doc) return doc._id;
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * FInds a document based on the given filtering object
   * 
   * @param {*} filterObj - a filtering object to use for the lookup
   * @param {*} docType  - document's collection where to look
   * @returns a found document, if not found, null
   */
  async findDoc(filterObj, docType) {
    let docCol = null;

    if (docType === 'book') docCol = await this.bookCollection();
    if (docType === 'bookshelf') docCol = await this.bookshelfCollection();
    if (docType === 'category') docCol = await this.categoryCollection();
    if (docType === 'user') docCol = await this.userCollection();

    if (!docCol) return null;

    try {
      const doc = await docCol.findOne(filterObj);
      if (!doc) return null;
      return doc;
    } catch (error) {
      return null;
    }
  }
}

const mongoDbClient = new MongoDBClient();

module.exports = mongoDbClient;
