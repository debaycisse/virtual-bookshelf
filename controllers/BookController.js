const mime = require('mime-types');
const Utils = require('../utils/Utils');
const mongoDbClient = require('../utils/mongo');
const { ObjectId } = require('mongodb');

const baseUrl = 'http://127.0.0.1:5000/api/v1';

class BookController {
  /**
   * Takes required data to create a new book.
   * Creates a new book instance and stores the same into the database.
   * 
   * @param {*} req - URL's request object
   * @param {*} res - URL's response object
   * @returns a newly created book's object
   */
  static async createBook(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      /**
       * Obtains the data of a user who makes the reques
       */
      const userData = await Utils.extractJwt(req.headers['X-User']);
      
      /**
       * Retrieves, validates, and authenticates a given bookshelf
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

      const userOwnsBookshelf = await Utils
      .ownsBookshelf(userData._id, bookshelfId);
      if (!userOwnsBookshelf) {
        return res.status(401).json({
          error: 'Unauthorized bookshelf access'
        });
      }

      /**
       * Retrieves, validates, and authenticates a given book's category
       */
      const categoryId = req.body?.categoryId;
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
         * Does a given category exist in a given bookshelf
         */
        if (!await Utils.bookshelfOwnsCategory(bookshelfId, categoryId)) {
          return res.status(404).json({
            error: 'Category does not exist in a given bookshelf',
          });
        }
      }

  
      /**
       * Uploads and creates the actual book (e-book).
       * This is stored inside the root of the project.
       * The path to the created book is returned.
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
        bookPath: fileFullePath, dateCreated: date.toLocaleString(),
        dateModified: date.toLocaleString(),
      });

      /**
       * Updates the book category to track a number of books, stored in it
       */
      if (categoryId) {
        await Utils
          .updateCategoryBookCount(categoryId, categoryId, '+');
      }

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

  /**
   * Retrieves a book's data and returns it.
   * Takes an id of the book, the bookshelf where it resides, and
   * optionally the category if it uses one
   * 
   * @param {*} req - URL's request object
   * @param {*} res - URL's response object
   * @returns  a set of data of the requsted book
   */
  static async getBook(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const userData = await Utils.extractJwt(req.headers['X-User']);
      const bookCol = await mongoDbClient.bookCollection();
      let bookDoc;

      /**
       * Validates a given book's id
       */
      const bookId = req.params.id;
      if (!bookId) {
        return res.status(400).json({
          error: 'Book\'s ID can not be missing',
        });
      }

      const isBook = await mongoDbClient
         .verifyDocType(bookId, 'book');
      if (!isBook) {
        return res.status(404).json({
          error: 'Book does not exist',
        });
      }

      /**
       * Does the current user owns the Bookshelf
       */
      bookDoc = await bookCol.findOne({
        _id: new ObjectId(bookId),
      });

      if (!bookDoc) {
        return res.status(404).json({
          error: 'Book not foound',
        });
      }

      const bookshelfId = bookDoc.bookshelfId;
      const userOwnsBookshelf = await Utils
        .ownsBookshelf(userData._id, bookshelfId);
      if (!userOwnsBookshelf) {
        return res.status(401).json({
          error: 'Unauthorized bookshelf access'
        });
      }

      /**
       * Returns a set of data of the requested book, which is obtained
       * from the database where the book is stored
       */
      return res.status(200).json({
        id: bookDoc._id,
        name: bookDoc.name,
        author: bookDoc.author? bookDoc.author : null,
        publishedInYear: bookDoc.publishedInYear? bookDoc.publishedInYear : null,
        numberOfPages: bookDoc.numberOfPages? bookDoc.numberOfPages : null,
        bookshelfId: bookDoc.bookshelfId,
        categoryId: bookDoc?.categoryId? bookDoc?.categoryId : null,
        bookPath: bookDoc.bookPath,
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

  /**
   * Retrieves multiple books' data and returns them. A maximum of 10 items
   * per request.
   * It uses URL query, named page to scrol throuhg multiple pages.
   * 
   * @param {*} req - URL's request object 
   * @param {*} res - URL's response object
   * @returns a list, which contains multiple sets of 
   * different books, stored into the database
   */
  static async getBooks(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const userData = await Utils.extractJwt(req.headers['X-User']);
      let filters;
      const maxItems = 10;
      let { page } = req.query;

      if(!page) {
        page = 0;
      } else {
        page = Number(page);
      }

      // Get bookshelfs where this user appears as parentID
      const bookshelfCol = await mongoDbClient.bookshelfCollection();
      const userBookshelfDocs = await bookshelfCol
        .find(
          { parentId: userData._id },
        ).toArray();
      const userBookshelfIds = userBookshelfDocs
        .map(bookshelf => bookshelf._id.toString());

      filters = {
        bookshelfId: {
          $in: userBookshelfIds,
        }
      }
      /**
       * Creates pipeline, which is used in the aggregate function of the
       * database to create a pagination
       */
      const pipeline = [
        {
          $match: {
            bookshelfId: { $in: userBookshelfIds },
          }
        },
        {
          $project: {
            id: '$_id', name: 1, author: 1, publishedInYear: 1,
            numberOfPages: 1, bookshelfId: 1, categoryId: 1,
            bookPath: 1, dateCreated: 1, dateModified: 1, _id: 0,
          },
        },
        {
          $sort: { dateCreated: -1 },
        },
        {
          $skip: page * maxItems,
        },
        {
          $limit: maxItems,
        },
      ];

      /**
       * Aggregates multiple books and converts them to an array
       */
      let bookList;
      const bookCol = await mongoDbClient.bookCollection();
      const books = await bookCol
        .aggregate(pipeline).toArray();

      console.log(`books.length  ${books.length}`)
      /**
       * Rearranges the elements for each of the aggregated data
       */
      if (books.length > 0) {
        bookList = books.map(doc => {
          return {
            id: doc.id,
            name: doc.name,
            author: doc.author,
            publishedInYear: doc.publishedInYear,
            numberOfPages: doc.numberOfPages,
            bookshelfId: doc.bookshelfId,
            categoryId: doc.categoryId,
            bookPath: doc.bookPath,
            dateCreated: doc.dateCreated,
            dateModified: doc.dateModified
          };
        });
      }

      /**
       * Computes next and previous page's URL.
       * Returns the parsed aggregated data
       */
      let nextPage = null;
      const processedDocCount = (page * maxItems) + books.length;
      const totalDocCount = await bookCol.countDocuments(filters);

      if (totalDocCount > processedDocCount) {
        nextPage = page + 1;
      }

      let prevPage = 0;
      const isSkipped = (page * maxItems) > 0;
      if (isSkipped) prevPage = page - 1;

      const currentPage = page + 1;

      let previousPage = null;
      if (page > 0) {
        previousPage = `${baseUrl}/books?page=${prevPage}`
      }

      return res.status(200).json({
        books: bookList? bookList : [],
        currentPage,
        previousPage,
        nextPage: nextPage? `${baseUrl}/books?page=${nextPage}` : null,
        retrieveBook: `${baseUrl}/book/<id>`,
        removeBook: `${baseUrl}/book/<id>`,
      });

    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        detail: error.message,
      });
    }
  }

  /**
   * Modifies a book whose ID is given and returns the updated data.
   * 
   * @param {*} req - URL's request object
   * @param {*} res - URL's response object
   * @returns the updated version of a just altered book
   */
  static async modifyBook(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const userData = await Utils.extractJwt(req.headers['X-User']);
      let tempBook;
      let bookUsedCategoryId
      let filter;
      const bookCol = await mongoDbClient.bookCollection();
      const bookId = req.params.id;

      /**
       * Validates and authenticates a retrieved book's ID
       */
      if (!bookId) {
        return res.status(400).json({
          error: 'Book\'s  ID can not be missing',
        });
      }
      const isBook = await mongoDbClient
         .verifyDocType(bookId, 'book');
      
      if (!isBook) {
        return res.status(404).json({
          error: 'Book does not exist',
        });
      }

      /**
       * Retrieves and validates a provided bookshelf
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
        return res.status(404).json({
          error: 'Bookshelf does not exist',
        });
      }

      /**
       * Does the current user have permission over the bookshelf
       */
      const userOwnsBookshelf = await Utils
      .ownsBookshelf(userData._id, bookshelfId);
      if (!userOwnsBookshelf) {
        return res.status(401).json({
          error: 'Unauthorized bookshelf access'
        });
      }

      /**
       * Retrieves and parses the category's ID, if one is provided
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

        if (!await Utils.bookshelfOwnsCategory(bookshelfId, categoryId)) {
          return res.status(404).json({
             error: 'Category does not exist in a given bookshelf',
          });
        }
        filter = {
          _id: new ObjectId(bookId),
          bookshelfId,
          categoryId,
        };

      } else {
        /**
         * Does the book's categoryId exist in the given bookshelf
         */
        tempBook = await bookCol.find({ _id: new ObjectId(bookId) });
        bookUsedCategoryId = tempBook?.categoryId;
        if (bookUsedCategoryId) {
          if (!await Utils.bookshelfOwnsCategory(bookshelfId, bookUsedCategoryId)) {
            return res.status(404).json({
              error: 'Category does not exist in a given bookshelf',
            });
          }
        }

        filter = {
          _id: new ObjectId(bookId),
          bookshelfId,
        };
      }

      const existingCategoryId = tempBook?.categoryId? 
        tempBook?.categoryId : categoryId;
      /**
       * Updates the book
       */
      const {
        name, author, publishedInYear, numberOfPages,
      } = req.body;
      const date = new Date();      
      const update = {
        $set: {
          name,
          author,
          categoryId: categoryId? categoryId : bookUsedCategoryId,
          dateModified: date.toLocaleString(),
        },
      };

      /**
       * Validate the correctness of both publishedInYear and
       * numberOfPages objects' keys
       */
      const publishedInYearVal = Number(publishedInYear);
      const numberOfPagesVal = Number(numberOfPages);
      if (typeof publishedInYearVal === 'number') {
        update.$set['publishedInYear'] = publishedInYearVal;
      }
      if (typeof numberOfPagesVal === 'number') {
        update.$set['numberOfPages'] = numberOfPagesVal;
      }

      /**
       * Updates the book's record in the database and the book's category,
       * especially if the book is placed in a new category
       */
      const isUpdated = await bookCol.updateOne(filter, update);
      if (isUpdated.modifiedCount > 0) {
        if (categoryId !== undefined) {
          if (existingCategoryId === categoryId) {
            await Utils.updateCategoryBookCount(
              existingCategoryId, categoryId, '+'
            );
          } else {
            await Utils.updateCategoryBookCount(
              existingCategoryId, categoryId, '-'
            );
          }
        }
      }
      /**
       * Retrieve and return the updated book
       */
      const updatedBook = await bookCol
        .findOne({ _id: new ObjectId(bookId) });
      console.log(`${JSON.stringify(updatedBook)}`)
      return res.status(200).json({
        id: updatedBook._id,
        name: updatedBook.name,
        author: updatedBook.author,
        publishedInYear: updatedBook.publishedInYear,
        numberOfPages: updatedBook.numberOfPages,
        bookshelfId: updatedBook.bookshelfId,
        categoryId: updatedBook.categoryId,
        bookPath: updatedBook.bookPath,
        dateCreated: updatedBook.dateCreated,
        dateModified: updatedBook.dateModified,
        retrieveAllBooks: `${baseUrl}/books`,
        retrieveBook: `${baseUrl}/book`,
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        detail: error.message
     });
    }
  }

  /**
   * Removes a book from the database
   * 
   * @param {*} req - - URL's request object
   * @param {*} res - URL's response object
   * @returns no content with status code 204
   */
  static async deleteBook(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const userData = await Utils.extractJwt(req.headers['X-User']);
      const bookCol = await mongoDbClient.bookCollection();
      const bookId = req?.params?.id;
      let filter;
      let categoryUsedInBook;

      /**
       * Is the given book valid
       */
      if (!bookId) {
        return res.status(400).json({
          error: `Book's ID can not be missing`,
        });
      }

      const isBook = await mongoDbClient
      .verifyDocType(bookId, 'book');
      
      if (!isBook) {
        return res.status(404).json({
          error: 'Book does not exist',
        });
      }

      /**
       * Validate the given bookshelf
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
        return res.status(404).json({
          error: 'Bookshelf does not exist',
        });
      }

      /**
       * Does the given user have access to the bookshelf
       */
      const userOwnsBookshelf = await Utils
      .ownsBookshelf(userData._id, bookshelfId);

      if (!userOwnsBookshelf) {
        return res.status(401).json({
          error: 'Unauthorized bookshelf access'
        });
      }

      /**
       * Checks if category is given and validates it
       */
      const categoryId = req.body.categoryId;
      if (categoryId) {
        const isCategory = await mongoDbClient
          .verifyDocType(categoryId, 'category');

        if (!isCategory) {
          return res.status(400).json({
            error: 'Invalid category id',
          });
        }

        filter = {
          _id: new ObjectId(bookId),
          bookshelfId,
          categoryId
        };

        const bookDoc = await bookCol.findOne(filter);
        console.log(`bookDoc >> ${JSON.stringify(bookDoc)}`)

        if (!bookDoc) {
          return res.status(404).json({
            error: 'Book not found',
          });
        }

        categoryUsedInBook = categoryId;
      } else {
        const bookDoc = await bookCol
          .findOne({ _id: new ObjectId(bookId),
            bookshelfId
           });

        if (!bookDoc) {
          return res.status(404).json({
            error: 'Book not found',
          });
        }

        filter = {
          _id: new ObjectId(bookId),
          bookshelfId,
        };

        categoryUsedInBook = bookDoc.categoryId;
      }

      const isDeleted = await bookCol.deleteOne(filter);
      if (isDeleted.deletedCount < 1) {
        return res.status(500).json({
          error: 'Failed to delete',
        });
      }
      if (isDeleted.deletedCount > 0) {
        await Utils.updateCategoryBookCount(
          categoryUsedInBook, categoryUsedInBook, null
        );
      }
      return res.status(204).json({});
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        detail: error.message,
      });
    }
  }
  
}

module.exports = BookController;
