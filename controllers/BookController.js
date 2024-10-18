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
        bookPath: fileFullePath,
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
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const userData = await Utils.extractJwt(req.headers['X-User']);
      const bookCol = await mongoDbClient.bookCollection();
      let bookDoc;

      /**
       * Is book's ID provided
       */
      const bookId = req.params.id;
      if (!bookId) {
        return res.status(400).json({
          error: 'Book\'s ID can not be missing',
        });
      }

      /**
       * Ensures that bookshelf is provided
       */
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

      /**
       * Does the current user owns the Bookshelf
       */
      const userOwnsBookshelf = await Utils
      .ownsBookshelf(userData._id, bookshelfId);
      if (!userOwnsBookshelf) {
        return res.status(401).json({
          error: 'Unauthorized bookshelf access'
        });
      }
      
      /**
       * If category's ID is given, does the current user possess the category
       */
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

        /**
         * Is a given category located in a given bookshelf
         */
        if (!await Utils.bookshelfOwnsCategory(bookshelfId, categoryId)) {
          return res.status(404).json({
            error: 'Category does not exist in a given bookshelf',
          });
        }

        /**
         * Find the book, using both its ID, the given bookshelf's ID,
         * and the given category's ID
         */
        bookDoc = await bookCol
          .findOne({
            _id: new ObjectId(bookId),
            bookshelfId: bookshelfId,
            categoryId: categoryId,
          });

        if (!bookDoc) {
          return res.status(404).json({
            error: 'Book not foound',
          });
        }
      } else {
        /**
         * Find the book, using both its ID, and the given bookshelf's ID,
         * since no category is given
         */
        bookDoc = await bookCol
          .findOne({
            _id: new ObjectId(bookId),
            bookshelfId: bookshelfId,
          });

        if (!bookDoc) {
          return res.status(404).json({
            error: 'Book not foound',
          });
        }

        /**
         * Ensures that the cateogry of the book is
         * located in the provided bookshelf
         */
        const bookCategoryId = bookDoc.categoryId;
        if (bookCategoryId) {
          const categoryCol = await mongoDbClient.categoryCollection();
          const categoryDoc = categoryCol
            .findOne({ _id: new ObjectId(bookCategoryId) });
          const categoryParentId = categoryDoc.parentId;
          if (categoryParentId !== bookshelfId) {
            return res.status(401).json({
              error: 'Category is not located in the given bookshelf',
            });
          }
        }
      }

      /**
       * Return the book's data
       */
      return res.status(200).json({
        id: bookDoc._id,
        name: bookDoc.name,
        author: bookDoc.author? bookDoc.author : null,
        publishedInYear: bookDoc.publishedInYear? bookDoc.publishedInYear : null,
        numberOfPages: bookDoc.numberOfPages? bookDoc.numberOfPages : null,
        bookshelfId: bookDoc.bookshelfId,
        categoryId: categoryId? bookDoc.categoryId : null,
        bookPath: bookDoc.path,
        dateCreated: bookDoc.dateCreated,
        dateModified: bookDoc.dateModified,
        retrieveAllBooks: `${baseUrl}/books`,
        createBook: `${baseUrl}/book`,
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        detail: error.message,
      });
    }
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
