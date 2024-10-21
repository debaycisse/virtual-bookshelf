const mime = require('mime-types');
const Utils = require('../utils/Utils');
const mongoDbClient = require('../utils/mongo');
const { ObjectId } = require('mongodb');

const baseUrl = 'http://127.0.0.1:5000/api/v1';

class CategoryController {
  /**
   * Takes required data to create a new book category.
   * Creates a new book category instance and stores the same into the database.
   * 
   * @param {*} req - URL's request object
   * @param {*} res - URL's response object
   * @returns a newly created book category's object
   */
  static async createCategory(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const userData = await Utils.extractJwt(req.headers['X-User']);
      const parentId = req.body.parentId;
      /**
       * Retrieves and validates a given parentId, which is a bookshelf to
       * store the book category, about to be created or a bookshelf that
       * contains this very book category about to be created
       */
      if (!parentId) {
        return res.status(400).json({
          error: 'Parent ID can not be missing',
        });
      }

      /**
       * Ensures that a given bookshelf (parentId) is valid and that
       * it belongs to the current user
       */
      if (!(await mongoDbClient.verifyDocType(parentId, 'bookshelf'))) {
        return res.status(400).json({
          error: 'Invalid parent ID',
        });
      }

      if (!(Utils.ownsBookshelf(userData._id, parentId))) {
        return res.status(401).json({
          error: 'Unauthorized access',
        });
      }

      const categoryName = req.body.name;
      if (!categoryName) {
        return res.status(400).json({
          error: 'Name can not be missing',
        });
      }

      const date = new Date();
      const categoryDoc = {
        name: categoryName,
        parentId,
        nBooks: 0,
        dateCreated: date.toLocaleString(),
        dateModified: date.toLocaleString(),
      };

      const categoryCol = await mongoDbClient.categoryCollection();
      const insertedDoc = await categoryCol.insertOne(categoryDoc);
      return res.status(201).json({
        id: insertedDoc.insertedId,
        name: categoryDoc.name,
        parentId,
        nBooks: categoryDoc.nBooks,
        message: 'created category successfully',
        dateCreated: categoryDoc.dateCreated,
        dateCreated: categoryDoc.dateModified,
        retrieveAllCategories: `${baseUrl}/categories`,
	      retrieveCategory: `${baseUrl}/category/<id>`,
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        detail: error.message,
      });
    }
  }

  /**
   * Retrieves a book category's data 
   * 
   * @param {*} req - URL's request object
   * @param {*} res - URL's response object
   * @returns an object that contains a book category's data
   */
  static async getCategory(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const userData = await Utils.extractJwt(req.headers['X-User']);
      const categoryCol = await mongoDbClient.categoryCollection();
      
      /**
       * Validates a given book category's ID
       */
      const categoryId = req.params.id;
      if (!categoryId) {
        return res.status(400).json({
          error: 'Document\'s id can not be missing',
        });
      }
      
      const categoryDoc = await categoryCol.findOne(
        { _id: new ObjectId(categoryId) },
      );

      if (!categoryDoc) {
        return res.status(404).json({
          error: 'Not found',
        });
      }

      /**
       * Verifies that a current user can access a given bookshelf
       */
      const parentId = categoryDoc.parentId;
      if (!(Utils.ownsBookshelf(userData._id, parentId))) {
        return res.status(401).json({
          error: 'Unauthorized access',
        });
      }
      
      /**
       * Returnns a found data of the book category
       */
      return res.status(200).json({
        id: categoryDoc._id,
        name: categoryDoc.name,
        parentId: categoryDoc.parentId,
        nBooks: categoryDoc.nBooks,
        dateCreated: categoryDoc.dateCreated,
        dateModified: categoryDoc.dateModified,
        retrieveAllCategories: `${baseUrl}/categories`,
        retrieveCategory: `${baseUrl}/category/<id>`,
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        detail: error.message,
      });
    }
  }

  /**
   * Retrieves multiple sets of book categories
   * 
   * @param {*} req - URL's request object
   * @param {*} res - URL's response object
   * @returns a list of multiple sets of book categories' data
   */
  static async getCategories(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const userData = await Utils.extractJwt(req.headers['X-User']);
      const maxItems = 10;
      let { page } = req.query;

      const categoryCol = await mongoDbClient.categoryCollection();

      // Get bookshelfs where this user appears as parentID
      const bookshelfCol = await mongoDbClient.bookshelfCollection();
      const userBookshelfDocs = await bookshelfCol
        .find(
          { parentId: userData._id },
        ).toArray();
      const userBookshelfIds = userBookshelfDocs
        .map(bookshelf => bookshelf._id.toString());

      /**
       * Parses a url string query, named page to allow user to move
       * between pages
       */
      if(!page) {
        page = 0;
      } else {
        page = Number(page);
      }

      /**
       * Aggregates multiple book categories and converts them to an array
       */
      let categoryList = [];
      const pipline = [
        {
          $match: { parentId: { $in: userBookshelfIds } },
        },
        {
          $project: {
            id: '$_id', name: 1, parentId: 1, nBooks: 1,
            dateCreated: 1, dateModified: 1, _id: 0
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
      ]
      const categories = await categoryCol
        .aggregate(pipline).toArray();

      /**
       * Re-arranges data in the aggregated array data
       */
      if (categories.length > 0) {
        categoryList = categories.map(doc => {
          return {
            id: doc.id,
            name: doc.name,
            parentId: doc.parentId,
            nBooks: doc.nBooks,
            dateCreated: doc.dateCreated,
            dateModified: doc.dateModified,
          };
        });
      }

      /**
       * Computes the value for both next and previous page, which
       * gives user an idea on how to navigate through multiple pages
       */
      let nextPage = null;
      const processedDocCount = page * maxItems + categories.length;
      const totalDocCount = await categoryCol
        .countDocuments({ parentId: { $in: userBookshelfIds } });

      if (totalDocCount > processedDocCount) {
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
        previousPage = `${baseUrl}/categories?page=${prevPage}`
      }

      return res.status(200).json({
        categories: categoryList,
        currentPage,
        previousPage,
        nextPage: nextPage? `${baseUrl}/categories?page=${nextPage}` : null,
        retrieveCategory: `${baseUrl}/category/<id>`,
        removeCategory: `${baseUrl}/category/<id>`,
      });

    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        detail: error.message,
      });
    }
  }

  /**
   * Modifies a book category 
   * 
   * @param {*} req - URL's request object
   * @param {*} res - URL's response object
   * @returns an object that contains a book category's updated data
   */
  static  async modifyCategory(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const userData = await Utils.extractJwt(req.headers['X-User']);
      const parentId = req.body.parentId;

      /**
       * Validates a given user's and bookshelf's ID
       */
      if (!parentId) {
        return res.status(400).json({
          error: 'Parent ID can not be missing',
        });
      }

      if (!(await mongoDbClient.verifyDocType(parentId, 'bookshelf'))) {
        return res.status(400).json({
          error: 'Invalid parent ID',
        });
      }

      /**
       * Verifies that a current user can access a given bookshelf
       */
      if (!(Utils.ownsBookshelf(userData._id, parentId))) {
        return res.status(401).json({
          error: 'Unauthorized access',
        });
      }

      /**
       * Retrieves and validates a given book category
       */
      const categoryId = req.params.id;
      if (!categoryId) {
        return res.status(400).json({
          error: 'Document\'s id can not be missing',
        });
      }

      const filter = {
        _id: new ObjectId(categoryId),
        parentId,
      };

      /**
       * Updates the book cateogry whose ID is given and tracks
       * operation status
       */
      const dateModified = new Date();

      const update = { $set: { dateModified: dateModified.toLocaleString() } };
      if (req.body.name) update.$set['name'] = req.body.name;
      if (req.body.nBooks) update.$set['nBooks'] = req.body.nBooks;

      const categoryCol = await mongoDbClient.categoryCollection();
      let updatedCategory = await categoryCol.updateOne(filter, update);

      if (updatedCategory.modifiedCount < 1) {
        return res.status(404).json({
          error: 'Category not found',
        });
      }

      /**
       * Retrieves the updated data and returns it
       */
      updatedCategory = await categoryCol.findOne(filter);

      return res.status(200).json({
        id: updatedCategory._id,
        name: updatedCategory.name,
        parentId: updatedCategory.parentId,
        nBooks: updatedCategory.nBooks,
        dateCreated: updatedCategory.dateCreated,
        dateModified: updatedCategory.dateModified,
        retrieveCategory: `${baseUrl}/category/<id>`,
        removeCategory: `${baseUrl}/category/<id>`,
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        detail: error.message,
      });
    }
  }

  /**
   * Deletes a book category 
   * 
   * @param {*} req - URL's request object
   * @param {*} res - URL's response object
   * @returns HTTP status 204 to indicate success operation status
   */
  static async deleteCategory(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const userData = await Utils.extractJwt(req.headers['X-User']);

      /**
       * Ensures that a given book category to be deleted, indeed exists
       */
      const categoryId = req.params.id;
      if (!categoryId) {
        return res.status(400).json({
          error: 'Document\'s id can not be missing',
        });
      }

      const categoryCol = await mongoDbClient.categoryCollection();

      // const parentId = req.body.parentId;
      // /**
      //  * Validates a given user's and bookshelf ID
      //  */
      // if (!parentId) {
      //   return res.status(400).json({
      //     error: 'Parent ID can not be missing',
      //   });
      // }

      // if (!(await mongoDbClient.verifyDocType(parentId, 'bookshelf'))) {
      //   return res.status(400).json({
      //     error: 'Invalid parent ID',
      //   });
      // }

      // /**
      //  * Verifies a given usr can access a given bookshelf
      //  */
      // if (!(Utils.ownsBookshelf(userData._id, parentId))) {
      //   return res.status(401).json({
      //     error: 'Unauthorized access',
      //   });
      // }

      /// find the bookshelf associtaed with it
      const categoryDoc = await categoryCol.findOne(
        { _id: new ObjectId(categoryId) },
      )
      if (!categoryDoc) {
        return res.status(400).json({
          error: 'Invalid category\'s ID',
        });
      }

      // Check if this user owns it
      const bookshelfAssociated = categoryDoc.parentId;
      const bookshelfCol = await mongoDbClient.bookshelfCollection();
      const bookshelfDoc = await bookshelfCol.findOne({
        _id: new ObjectId(bookshelfAssociated),
      });
      if (!bookshelfDoc) {
        return res.status(404).json({
          error: 'Invalid bookshelf or parentId',
        });
      }

      if (!Utils.ownsBookshelf(userData._id, bookshelfDoc._id)) {
        return res.status(401).json({
          error: 'Unauthorized access',
        })
      }

      /**
       * Ensures that a given book category does not contains any
       * book before attempting to delete it
       */
      const isCategoryEmpty = await Utils.isEmpty(categoryId, 'category');
      if (!isCategoryEmpty) {
        return res.status(400).json({
          error: 'Non-empty category can not be deleted',
        });
      }

      /**
       * Deletes a book category and tracks the operation status
       */
      const isDeleted = await categoryCol
        .deleteOne({ _id: new ObjectId(categoryId) });
      if (Number(isDeleted?.deletedCount) > 0) {
        return res.status(204).json({});
      }

      return res.status(500).json({
        error: 'Internal server error',
        detail: 'Can not delete category',
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        detail: error.message,
      });
    }
  }
}

module.exports = CategoryController;
