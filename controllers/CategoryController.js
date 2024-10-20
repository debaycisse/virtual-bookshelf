const mime = require('mime-types');
const Utils = require('../utils/Utils');
const mongoDbClient = require('../utils/mongo');
const { ObjectId } = require('mongodb');

const baseUrl = 'http://127.0.0.1:5000/api/v1';

class CategoryController {
  static async createCategory(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const userData = await Utils.extractJwt(req.headers['X-User']);
      const parentId = req.body.parentId;
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

  static async getCategory(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const userData = await Utils.extractJwt(req.headers['X-User']);
      const parentId = req.body.parentId;
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

      if (!(Utils.ownsBookshelf(userData._id, parentId))) {
        return res.status(401).json({
          error: 'Unauthorized access',
        });
      }

      const categoryId = req.params.id;
      if (!categoryId) {
        return res.status(400).json({
          error: 'Document\'s id can not be missing',
        });
      }
      const filter = {
        _id: new ObjectId(categoryId),
        parentId,
      }
      const categoryDoc = await mongoDbClient
        .findDoc(filter, 'category');

      if (!categoryDoc) {
        return res.status(404).json({
          error: 'Not found',
        });
      }
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

  static async getCategories(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const userData = await Utils.extractJwt(req.headers['X-User']);
      const parentId = req.body.parentId;
      const maxItems = 10;
      let { page } = req.query;

      if(!page) {
        page = 0;
      } else {
        page = Number(page);
      }

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

      if (!(Utils.ownsBookshelf(userData._id, parentId))) {
        return res.status(401).json({
          error: 'Unauthorized access',
        });
      }

      let categoryList = [];
      const categoryCol = await mongoDbClient.categoryCollection();
      const pipline = [
        {
          $match: { parentId: parentId },
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

      let nextPage = null;
      const processedDocCount = page * maxItems + categories.length;
      const totalDocCount = await categoryCol
        .countDocuments({ parentId });

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

  static  async modifyCategory(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const userData = await Utils.extractJwt(req.headers['X-User']);
      const parentId = req.body.parentId;
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

      if (!(Utils.ownsBookshelf(userData._id, parentId))) {
        return res.status(401).json({
          error: 'Unauthorized access',
        });
      }

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

  static async deleteCategory(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const userData = await Utils.extractJwt(req.headers['X-User']);
      const parentId = req.body.parentId;
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

      if (!(Utils.ownsBookshelf(userData._id, parentId))) {
        return res.status(401).json({
          error: 'Unauthorized access',
        });
      }

      const categoryId = req.params.id;
      if (!categoryId) {
        return res.status(400).json({
          error: 'Document\'s id can not be missing',
        });
      }

      const isCategoryEmpty = await Utils.isEmpty(categoryId, 'category');
      if (!isCategoryEmpty) {
        return res.status(400).json({
          error: 'Non-empty category can not be deleted',
        });
      }

      const categoryCol = await mongoDbClient.categoryCollection();
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
