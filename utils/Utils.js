require('dotenv').config();
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const mongoDbClient = require('./mongo');
const redisClient = require('./redis');

/**
 * Utils class is used to perform several operation on behalf of the several
 * modules that consume it. It can be said to house helper functions that are
 * used in several places through the system
 */
class Utils {
  /**
   * Validates a given email
   * 
   * @param {string} email - email to be validated
   * @returns true if it is valid, else false
   */
  static validateEmail(email) {
    // const emailPattern = process.env.EMAIL_PATTERN;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  /**
   * Validates a given password by checking if it contains aplhanumeric with 
   *  minimum length of 8 characters
   * 
   * @param {string} password - password to be validated
   * @returns true if it passes, otherwise false
   */
  static validatePassword(password) {
    if (password.length < 8) return false;
    // const passwordPattern = process.env.PAS_PATTERN;
    const passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).+$/;
    return passwordPattern.test(password);
  }

  /**
   * Hashes a given plain password
   * 
   * @param {string} password - password to be hashed
   * @returns the hashed version of a given plain password
   */
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPwd = await bcrypt.hash(password, salt);
    return hashedPwd;
  }

  /**
   * Inserts a given object into a given collection
   * 
   * @param {string} docType - the collection's name
   * @param {string} docObject - the object to be inserted
   * @returns an object that contains id and an
   * acknowldged values of the new or inserted document 
   */
  static async storeDoc(docType, docObject) {
    let docCollection;
    if (docType === 'user') {
      docCollection = await mongoDbClient.userCollection();
    } else if (docType === 'book') {
      docCollection = await mongoDbClient.bookCollection();
    } else if (docType === 'category') {
      docCollection = await mongoDbClient.categoryCollection();
    } else if (docType === 'bookShelf') {
      docCollection = await mongoDbClient.bookshelfCollection();
    }

    try {
      const insertedDoc = await docCollection.insertOne(docObject);
      if (insertedDoc) {
        return {
          id: insertedDoc.insertedId || insertedDoc._id,
          acknowledged: insertedDoc.acknowledged,
        };
      }
      return null;
    } catch(err) {
      return null;
    }
  }

  /**
   * Finds a user based on their email address
   * 
   * @param {string} email - email's value of a user to lookup
   * @returns null if no user matches, else the user object
   */
  static async findUserByEmail(email) {
    try{
      const userCollection = await mongoDbClient.userCollection();
      const user = await userCollection.findOne({ email });
      if (user) {
        return JSON.stringify(user);
      };
      return null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Authenticates a user by authenticating their submitted password
   * 
   * @param {string} plainPassword - a submitted password
   * @param {string} hashPassword - the hashed value of the same password
   * @returns true if passwords match, else false
   */
  static async authenticatesPassword(plainPassword, hashPassword) {
    try {
      await bcrypt.compare(plainPassword, hashPassword, (err, result) => {
        if (err) return false;
      });
      return true;
    } catch (err) {
      return null;
    }
  }

  /**
   * Generates a JWT token for a given user's data
   * 
   * @param {string} userDoc - the data to be tokenized
   * @returns the generated token is returned if no error, else null
   */
  static async generateToken(userDoc) {
    try {
      const token = jwt.sign(userDoc, process.env.JWT_SECRET);
      if (!token) return null;
      return token;
    } catch (err) {
      return null;
    }
  }

  /**
   * Fetches the authorization header's value
   * 
   * @param {string} req - a URL's request object from which authorization's
   * value is obtained
   * @returns the fetched value if presents, otherwise null
   */
  static fetchToken(req) {
    let token;
    try {
      token = req.headers.authorization.split(' ')[1];
    } catch (err) {
      return null;
    }
    return token;
  }

  /**
   * Extracts data, stored inside a JWT's token
   * 
   * @param {string} token - the token whose stored data is to be extracted
   * @returns the extracted value if no error, otherwise null
   */
  static async extractJwt(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Removes a given key and its associated value from the cache. The key is
   * obtained from a request auhorization header
   * 
   * @param {string} req - a request that contains the authorization header
   * @returns 'delete' if operation is successful
   */
  static async delSessionToken(req) {
    let token;
    let getJwt;
    try {
      if (!req.headers.authorization) {
        return 'Authorization header is missing';
      }
      token = req.headers.authorization.split(' ')[1];
      if (!token) return 'No token was found';

      getJwt = await redisClient.get(token);
      if (!getJwt) return 'Invalid or expired token';
    } catch (error) {
      throw error;
    }

    try {
      await redisClient.del(token);
    } catch (err) {
      return 'Unable to delete session';
    }
    return 'deleted';
  }

  /**
   * Authenticates a given request for every protected route
   * 
   * @param {string} req - URL's request header
   * @param {string} res - URL's respond header
   * @param {string} next - callback function that passes request to the
   * next request handler after this function has performed authentication
   * checks on the request
   */
  static async authentication(req, res, next) {
    try {
      const token = this.fetchToken(req);
      if (!token) return next(new Error('Invalid token'));

      const jwt = await redisClient.get(`${token}`);
      if (!jwt) return next(new Error('Invalid token\'s value'));

      const userData = await this.extractJwt(jwt);
      if (!userData) return next(new Error('Invalid user\'s data'));

      req.headers['X-User'] = jwt;
      next();

    } catch (err) {
      next(err);
    }
  }

  /**
   * Checks if a given document (i.e. book category, bookshelf) does not
   * contain any other document.
   * 
   * @param {string} docId - document to check if it does not contain any
   * other document
   * @param {string} docType - a type of document (i.e. category, bookshelf)
   * to be checked
   * @returns true if it is empty, else false
   */
  static async isEmpty(docId, docType) {
    const bookCol = await mongoDbClient.bookCollection();
    const categoryCol = await mongoDbClient.categoryCollection();
    let existingBooks;
    let existingCategories;

    if (docType === 'bookshelf') {
      existingBooks = await bookCol
        .find({ bookshelfId: docId }).toArray();
      existingCategories = await categoryCol
        .find({ parentId: docId }).toArray();
    }

    if (docType === 'category') {
      existingBooks = await bookCol
        .find({ categoryId: docId }).toArray();
    }


    if (existingBooks?.length > 0 || existingCategories?.length > 0) {
      return false;
    }
    return true;
  }

  /**
   * Checks if a user owns a bookshelf
   * 
   * @param {string} userId - the ID of the user whose access is checked
   * @param {string} bookshelfId - the bookshelf to be checked against
   * @returns true if user owns a bookshelf, else false
   */
  static async ownsBookshelf(userId, bookshelfId) {
    try {
      const userExist = await mongoDbClient
        .verifyDocType(userId, 'user');
      const bookshelfExist = await mongoDbClient
        .verifyDocType(bookshelfId, 'bookshelf');

      if (!userExist) return false;
      if (!bookshelfExist) return false;

      const bookshelfCol = await mongoDbClient.bookshelfCollection();
      const bookshelfDoc = await bookshelfCol
        .findOne({ 
          _id: new ObjectId(bookshelfId),
          parentId: userId,
        });

      if (bookshelfDoc) return true;
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if a user owns a book category
   * 
   * @param {string} userId - the ID of the user whose access is checked
   * @param {string} categoryId - the book category to be checked against
   * @returns true if user owns a book category, else false
   */
  static async ownsCategory(userId, categoryId) {
    try {
      const userExist = await mongoDbClient
        .verifyDocType(userId, 'user');
      const categoryExist = await mongoDbClient
        .verifyDocType(categoryId, 'category');

      if (!userExist) return false;
      if (!categoryExist) return false;

      const categoryCol = await mongoDbClient.categoryCollection();
      const categoryDoc = await categoryCol
        .findOne({ _id: new ObjectId(categoryId) });
      if (!categoryDoc) return false;
      // parent id of a category is a bookshelf
      const categoryParentId = categoryDoc.parentId;
      const isFound = await this.ownsBookshelf(userId, categoryParentId);
      if (isFound) return true;
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if a given bookshelf contains a given book category
   * 
   * @param {string} bookshelfId - the bookshelf where to check
   * @param {string} categoryId - the book category to look for
   * @returns true if it is contained in the given bookshelf, else false
   */
  static async bookshelfOwnsCategory(bookshelfId, categoryId) {
    try {
      const categoryCol = await mongoDbClient.categoryCollection();
      const categoryDoc = await categoryCol
        .findOne({ _id: new ObjectId(categoryId)});
      const categoryParentId = categoryDoc.parentId;
      return categoryParentId === bookshelfId
    } catch (error) {
      return false;
    }
  }

  /**
   * Updates the value of number of book in a given category
   * 
   * @param {string} oldCategoryId - the existing book category
   * @param {string} newCategoryId - the new category that replaces
   * the exisitng one
   * @param {string} operator - an indicator to specify where to add
   * to or remove from the value of a given exisitng book category
   * @returns true if the operation is successful, else false
   */
  static async updateCategoryBookCount(
    oldCategoryId,
    newCategoryId,
    operator) {
      const categoryCol = await mongoDbClient.categoryCollection();
      let categoryDoc;

      if (operator === '+') {
        categoryDoc = await categoryCol
          .findOne({ _id: new ObjectId(oldCategoryId) });

        const nBooksVal = categoryDoc.nBooks? categoryDoc.nBooks : 0; 

        const filter = {
          _id: new ObjectId(oldCategoryId) 
        };

        const update = {
          $set: {
            nBooks: Number(nBooksVal) + 1,
          }
        };

        await categoryCol.updateOne(filter, update);
        return true;
      }

      if (operator === '-') {
        categoryDoc = categoryCol
          .findOne({ _id: new ObjectId(oldCategoryId) });

        const nBooksVal = categoryDoc.nBooks? categoryDoc.nBooks : 0; 

        const filter = { 
          _id: new ObjectId(oldCategoryId) 
        };

        const update = {
          $set: {
            nBooks: Number(nBooksVal) - 1,
          }
        };
        await categoryCol.updateOne(filter, update);

        categoryDoc = categoryCol
          .findOne({ _id: new ObjectId(newCategoryId) });
        const filter2 = {
          _id: new ObjectId(newCategoryId),
        };
        const update2 = {
          $set: {
            nBooks: Number(nBooksVal) + 1,
          }
        }
        await categoryCol.updateOne(filter2, update2);
        return true;
      }

      if (!operator) {
        categoryDoc = categoryCol
          .findOne({ _id: new ObjectId(oldCategoryId) });
        const filter = { 
          _id: new ObjectId(oldCategoryId) 
        };
        const update = {
          $set: {
            nBooks: Number(categoryDoc.nBooks) - 1,
          }
        };
        await categoryCol.updateOne(filter, update);
        return true;
      }

      return false;
  }

  /**
   * Uploads a file, found at a given path
   * 
   * @param {string} pathToFile - path to the file to be uploaded
   * @returns the path to the location to where file is uploaded
   */
  static async uploadBook(pathToFile) {
    try {
      const fileStoragepath = './bookshelf_folder/books';
      await fs.access(pathToFile, fs.constants.R_OK);
      await fs.mkdir(fileStoragepath, { recursive: true });
      const filePathLength = pathToFile.split('/').length;
      const fileName = pathToFile.split('/')[filePathLength - 1];
      const fileFullPath = `${fileStoragepath}/${fileName}`;
      const fileData = await fs.readFile(pathToFile);
      await fs.writeFile(fileFullPath, fileData);
      return fileFullPath;
    } catch (error) {
      throw error;
    }
  } 

  /**
   * Checks if the database and the cache are ready to start taking queries
   * 
   * @param {string} res - HTTP response object
   * @returns nothing if no error, else response object with error message
   */
  static async checkConnection(res) {
    const isAvailableMongo = await mongoDbClient.isAvailable();
    const isAvailableRedis = await redisClient.isAvailable();
     /**
     * Reports an error if the database or cache connection fails
     */
     if (!isAvailableMongo) {
      return res.status(500).json({
        status: 'Server not available',
        detail: 'Mongo DB is not connected',
      });
    }
    if (!isAvailableRedis) {
      return res.status(500).json({
        status: 'Server not available',
        detail: 'Redis is not connected',
      });
    }
  }

  /**
   * Retrieves all bookshelves owned by a user
   * 
   * @param {string} userId - an ID of the user
   * @returns all the matched bookshelve objects
   */
  static async bookshelfsByUserId(userId) {
    try {
      const bookshelfCol = await mongoDbClient.bookshelfCollection();
      const bookshelfs = await bookshelfCol
        .find({ parentId: userId }).toArray();
      return bookshelfs;
    } catch (error) {
      return [];
    }
  }
}

module.exports = Utils;
