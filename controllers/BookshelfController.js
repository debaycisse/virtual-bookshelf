const mime = require('mime-types');
const { ObjectId } = require('mongodb');
const mongoDbClient = require('../utils/mongo');
const Utils = require('../utils/Utils');

const baseUrl = 'http://127.0.0.1:5000/api/v1';

class BookshelfController {
  static async createBookshelf(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const userData = await Utils.extractJwt(req.headers['X-User']);
      const parentId = userData._id;

      if (!parentId) {
        return res.status(400).json({
          error: 'missing user\'s id',
        });
      }
      const shelfName = req.body.name;
      if (!shelfName) {
        return res.status(400).json({
          error: 'Bookshelf\'s name can not be missing',
        });
      }

      const bookshelfCol = await mongoDbClient.bookshelfCollection();
      const existingBookshelfs = await bookshelfCol
        .findOne({ parentId, name: shelfName });

      if (existingBookshelfs) {
        return res.status(400).json({
          error: 'Bookshelf\'s name already exists',
        });
      }

      const dateCreated = new Date();
      const doc = await bookshelfCol.insertOne({
        parentId,
        name: shelfName,
        dateCreated: dateCreated.toUTCString(),
        dateModified: dateCreated.toUTCString(),
      });
      return res.status(201).json({
        id: doc.insertedId,
        name: shelfName,
        parentId: parentId,
        message: 'created bookshelf successfully',
        dateCreated: dateCreated.toUTCString(),
        retrieveBookshelfs: `${baseUrl}/bookShelfs`,
        retrieveBookshelf: `${baseUrl}/bookShelf/<id>`,
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        detail: error.message,
      });
    }
  }

  static async getBookshelfs(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const userData = await Utils.extractJwt(req.headers['X-User']);
      const parentId = userData._id;
      const maxItems = 10;
      let { page } = req.query;

      if (!page) {
        page = 0;
      } else {
        page = Number(page);
      }

      if (!parentId) {
        return res.status(400).json({
          error: 'missing user\'s id',
        });
      }

      let bookshelfList = [];
      const bookshelfCol = await mongoDbClient.bookshelfCollection();
      const pipline = [
        {
          $match: { parentId },
        },
        {
          $project: {
            id: '$_id', parentId: 1, name: 1,
            dateCreated: 1, dateModified: 1, _id: 0,
          }
        },
        {
          $limit: maxItems,
        },
        {
          $skip: page * maxItems,
        }
      ]
      const bookshelfs = await bookshelfCol
        .aggregate(pipline).toArray();

      if (bookshelfs.length > 0) {
        bookshelfList = bookshelfs.map(doc => {
          return {
            id: doc.id,
            parentId: doc.parentId,
            name: doc.name,
            dateCreated: doc.dateCreated,
            dateModified: doc?.dateModified,
          }
        });
      }

      let nextPage = null;
      const processedDocCount = page * maxItems + bookshelfList.length;
      const totalDocCount = await bookshelfCol
        .countDocuments({ parentId });
      if ( totalDocCount > processedDocCount ){
        nextPage = page + 1;
      }

      let prevPage = 0;
      const isSkipped = (page * maxItems) > 0;
      if (isSkipped) {
        prevPage = page - 1;
      }
      const currentPage = page + 1;

      let previousPage = null;
      if (page > 0) {
        previousPage = `${baseUrl}/bookshelfs?page=${prevPage}`
      }

      return res.status(200).json({
        bookshelfs: bookshelfList,
        currentPage,
        previousPage,
        nextPage: nextPage? `${baseUrl}/bookshelfs?page=${nextPage}` : null, 
        retrieveBookshelf: `${baseUrl}/bookshelf/<id>`,
        removeBookshelf: `${baseUrl}/bookshelf/<id>`,
      });

    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        detail: error.message,
      })
    }
  }

  static async getBookshelf(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const userData = await Utils.extractJwt(req.headers['X-User']);
      const parentId = userData._id;

      if (!parentId) {
        return res.status(400).json({
          error: 'missing user\'s id',
        });
      }

      const shelfId = req.params.id;
      if (!shelfId) {
        return res.status(400).json({
          error: 'Bookshelf\'s id can not be missing',
        });
      }

      const bookshelfCol = await mongoDbClient.bookshelfCollection();
      const bookshelf = await bookshelfCol
        .findOne({ parentId, _id: new ObjectId(shelfId) });
      if (!bookshelf) {
        return res.status(401).json({
          error: 'shelf not found'
        });
      }

      return res.status(200).json({
        id: bookshelf._id,
        name: bookshelf.name,
        parentId: bookshelf.parentId,
        dateCreated: bookshelf.dateCreated,
        retrieveAllBookshelfs: `${baseUrl}/bookshelfs`,
        removeBookshelf: `${baseUrl}/bookshelf/<id>`,
      });

    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        detail: error.message,
      });
    }
  }

  static async modifyBookshelf(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const userData = await Utils.extractJwt(req.headers['X-User']);
      const parentId = userData._id;

      if (!parentId) {
        return res.status(400).json({
          error: 'missing user\'s id',
        });
      }

      const shelfId = req.params.id;
      if (!shelfId) {
        return res.status(400).json({
          error: 'Bookshelf\'s id can not be missing',
        });
      }

      const shelfName = req.body.name;
      if (!shelfName) {
        return res.status(400).json({
          error: 'Bookshelf\'s name can not be missing',
          detail: 'You can only alter a shelf\'s name'
        });
      }

      const bookshelfCol = await mongoDbClient.bookshelfCollection();
      let existingBookshelfs = await bookshelfCol
        .findOne({ parentId, _id: new ObjectId(shelfId) });

      if (!existingBookshelfs) {
        return res.status(404).json({
          error: 'Invalid product\'s or parent\'s id'
        });
      }

      const filter = {
        _id: new ObjectId(shelfId),
      };

      const dateModified = new Date();

      const update = {
        $set: {
          name: shelfName,
          dateModified: dateModified.toUTCString(),
        },
      };

      const updatedShelf = await bookshelfCol.updateOne(filter, update);
      if (updatedShelf.modifiedCount < 1) {
        return res.status(404).json({
          error: 'Internal server error',
          detail: 'Error updating shelf\'s name'
        });
      }

      existingBookshelfs = await bookshelfCol
        .findOne({ _id: new ObjectId(shelfId) });

      return res.status(200).json({
        id: existingBookshelfs._id,
        name: existingBookshelfs.name,
        parentId: existingBookshelfs.parentId,
        dateCreated: existingBookshelfs.dateCreated,
        dateModified: existingBookshelfs.dateModified,
        retrieveAllBookshelfs: `${baseUrl}/bookshelfs`,
        removeBookshelf: `${baseUrl}/bookshelf/<id>`,
      });
      
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        detail: error.message,
      });
    }
  }

  static async deleteBookshelf(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const userData = await Utils.extractJwt(req.headers['X-User']);
      const parentId = userData._id;

      if (!parentId) {
        return res.status(400).json({
          error: 'Missing user\'s id',
        });
      }

      const bookshelfId = req.params.id;
      if (!bookshelfId) {
        return res.status(400).json({
          error: 'Bookshelf\'s ID can not be missing'
        });
      }

      const isShelfEmpty = await Utils.isEmpty(parentId, 'bookshelf');
      if (!isShelfEmpty) {
        return res.status(400).json({
          error: 'Non-empty bookshelf can not be deleted',
        });
      }

      const bookshelfCol = await mongoDbClient.bookshelfCollection();
      const isDeleted = await bookshelfCol
        .deleteOne({ _id: new ObjectId(bookshelfId) });
      if (isDeleted.deletedCount > 0) {
        return res.status(204).json({});
      }

      return res.status(500).json({
        error: 'Internal server error',
        detail: 'Can not delete bookshelf',
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        detail: error.message,
      });
    }
  }
}

module.exports = BookshelfController;
