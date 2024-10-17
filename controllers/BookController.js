const mime = require('mime-types');
const Utils = require('../utils/Utils');
const mongoDbClient = require('../utils/mongo');
const { ObjectId } = require('mongodb');

const baseUrl = 'http://127.0.0.1:5000/api/v1';

class BookController {
  static async createBook(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    const userData = await Utils.extractJwt('X-User');
    
    const bookshelfId = req.body.bookshelfId;
    if (!bookshelfId) throw new Error('Bookshelf can not be missing');
    
    const isBookshelf = await mongoDbClient
      .verifyDocType(bookshelfId, 'bookshelf');
    if (!isBookshelf) throw new Error('Bookshelf does not exist');
    
    const userOwnsBookshelf = await Utils
    .ownsBookshelf(userData._id, bookshelfId);
    if (!userOwnsBookshelf) throw new Error('Unauthorized bookshelf access');
    
    const categoryId = req.body.categoryId;
    if (categoryId) {
      const isCategory = await mongoDbClient
        .verifyDocType(categoryId, 'category');
      if (!isCategory) throw new Error('Category does not exist');
      
      const userOwnsCategory = await Utils
        .ownsCategory(userData._id, categoryId);
      if (!userOwnsCategory) {
        throw new Error('Unauthorized book category access');
      }
    }

    if (!await Utils.bookshelfOwnsCategory(bookshelfId, categoryId)) {
      throw new Error('Category does not exist in a given bookshelf')
    }

    // Create the books -> Utils.uploadBook
    const filePath = req.body.upload;
    if (!filePath) throw new Error('No book or path to book was provided');
    const fileFullePath = await Utils.uploadBook(filePath);
    if (!fileFullePath) throw new Error('Couldn\'t upload file');
    // After the book has been uploaded
    const bookObj = {
      
    }
    // Insert book in to the DB
    // Then update the affected category's nBooks' value -> Utils.updateCategoryBookCount
    // Then return data

  }

  static async getBook(req, res) {
    // TODO: Implementation
  }

  static async getBooks(req, res) {
    // TODO: Implementation
  }

  static async modifyBook(req, res) {
    // TODO: Implementation
  }

  static async deleteBook(req, res) {
    // TODO: Implementation
  }
  
}

module.exports = BookController;
