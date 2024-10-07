require('dotenv').config();
const bcrypt = require('bcrypt');
const mongoDbClient = require('./mongo');

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
    } else if (docType === 'shelf') {
      docCollection = await mongoDbClient.shelfCollection();
    }

    try {
      const insertedDoc = await docCollection.insertOne(docObject);
      if (insertedDoc) {
        console.log(`Executing This Block >>> `)
        return {
          id: insertedDoc.insertedId || insertedDoc._id,
          dateCreated: new Date(),
        };
      }
      return null;
    } catch(err) {
      console.error('could not create document >> ', err.message);
      return null;
    }
  }
}

module.exports = Utils;
