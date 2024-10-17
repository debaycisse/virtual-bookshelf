const mime = require('mime-types');
const Utils = require('../utils/Utils');
const mongoDbClient = require('../utils/mongo');
const { ObjectId } = require('mongodb');

const baseUrl = 'http://127.0.0.1:5000/api/v1';

class BookController {
  static async createBook(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const userData = await Utils.extractJwt(req.headers['X-User']);
      
      const bookshelfId = req.body.bookshelfId;
      if (!bookshelfId) {
        return res.status(400).json({
          error: 'Bookshelf can not be missing',
        });
      }
      
      const isBookshelf = await mongoDbClient
        .verifyDocType(bookshelfId, 'bookshelf');
      if (!isBookshelf) {
        return res.status(400).json({
          error: 'Bookshelf does not exist',
        });
      }
      const userOwnsBookshelf = await Utils
      .ownsBookshelf(userData._id, bookshelfId);
      if (!userOwnsBookshelf) {
        return res.status(401).json({
          error: 'Unauthorized bookshelf access'
        });
      }
      
      const categoryId = req.body.categoryId;
      if (categoryId) {
        const isCategory = await mongoDbClient
          .verifyDocType(categoryId, 'category');
        if (!isCategory) {
          return res.status(404).json({
            error: 'Category does not exist',
          });
        }
        
        const userOwnsCategory = await Utils
          .ownsCategory(userData._id, categoryId);
        if (!userOwnsCategory) {
          return res.status(401).json({
            error: 'Unauthorized book category access',
          });
        }
      }
  
      if (!await Utils.bookshelfOwnsCategory(bookshelfId, categoryId)) {
        return res.status(404).json({
          error: 'Category does not exist in a given bookshelf',
        });
      }
  
      /**
       * Creates the actual book (e-book)
       */
      const filePath = req.body.upload;
      if (!filePath) {
        return res.status(400).json({
          error: 'No book or path to book was provided',
          detail: 'Invalid file path',
        });
      }
      const fileFullePath = await Utils.uploadBook(filePath);
      if (!fileFullePath) {
        return res.status(400).json({
          error: 'Couldn\'t upload file'
        });
      }

      /**
       * Inserts the book's data into the database
       */
      const {
        name, author,
        publishedInYear,
        numberOfPages
      } = req.body;
      if (!name) {
        return res.status(400).json({
          error: 'Book\'s name must not be missing'
        });
      }
      const date = new Date();
      const bookCol = await mongoDbClient.bookCollection();
      const insertedBook = await bookCol.insertOne({
        name, author, publishedInYear, numberOfPages,
        bookshelfId: bookshelfId,
        categoryId: categoryId? categoryId : null,
        path: fileFullePath, dateCreated: date.toLocaleString(),
        dateModified: date.toLocaleString(),
      })
      // Then update the affected category's nBooks' value -> Utils.updateCategoryBookCount
      /**
       * Updates the book category
       */
      if (categoryId) {
        await Utils
          .updateCategoryBookCount(categoryId, categoryId, '+');
      }
      // Then return data
      return res.status(201).json({
        id: insertedBook.insertedId,
        name,
        author,
        publishedInYear,
        numberOfPages,
        bookshelfId,
        categoryId: categoryId? categoryId : null,
        path: fileFullePath,
        dateCreated: date.toLocaleString(),
        dateModified: date.toLocaleString(),
        retrieveBook: `${baseUrl}/book`,
        retrieveAllBooks: `${baseUrl}/books`,
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        detail: error.message,
      });
    }
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
