require('dotenv').config();
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const mongoDbClient = require('./mongo');
const redisClient = require('./redis');

class Utils {
  static validateEmail(email) {
    // const emailPattern = process.env.EMAIL_PATTERN;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  static validatePassword(password) {
    if (password.length < 8) return false;
    // const passwordPattern = process.env.PAS_PATTERN;
    const passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_]).+$/;
    return passwordPattern.test(password);
  }

  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPwd = await bcrypt.hash(password, salt);
    return hashedPwd;
  }

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
      console.error('could not create document >> ', err.message);
      return null;
    }
  }

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

  static async generateToken(userDoc) {
    try {
      const token = jwt.sign(userDoc, process.env.JWT_SECRET);
      if (!token) return null;
      return token;
    } catch (err) {
      return null;
    }
  }

  static fetchToken(req) {
    let token;
    try {
      token = req.headers.authorization.split(' ')[1];
    } catch (err) {
      return null;
    }
    return token;
  }

  static async extractJwt(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      return null;
    }
  }

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

  static async isEmpty(docId, docType) {
    const bookCol = await mongoDbClient.bookCollection();
    const categoryCol = await mongoDbClient.categoryCollection();
    let existingBooks;
    let existingCategories;

    if (docType === 'bookshelf') {
      existingBooks = await bookCol
        .find({ parentId: new ObjectId(docId) }).toArray();
      existingCategories = await categoryCol
        .find({ parentId: new ObjectId(docId) });
    }

    if (docType === 'category') {
      existingBooks = await bookCol
        .find({ parentId: new ObjectId(docId) }).toArray();
    }


    if (existingBooks?.length > 0 || existingCategories?.length > 0) {
      return false;
    }
    return true;
  }

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
          ownerId: new ObjectId(userId),
        });

      if (bookshelfDoc) return true;
      return false;
    } catch (error) {
      return false;
    }
  }
}

module.exports = Utils;
