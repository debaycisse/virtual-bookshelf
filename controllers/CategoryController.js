const mime = require('mime-types');
const Utils = require('../utils/Utils');
const mongoDbClient = require('../utils/mongo');

class CategoryController {
  static async createCategory(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    try {
      const baseUrl = 'http://127.0.0.1:5000/api/v1';
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
        dateCreated: date.toUTCString(),
        dateModified: date.toUTCString(),
      };

      const categoryCol = await mongoDbClient.categoryCollection();
      const insertedDoc = await categoryCol.insertOne(categoryDoc);
      console.log(`insertedDoc : ${JSON.stringify(insertedDoc)}`);  //log out
      return res.status(201).json({
        id: insertedDoc.insertedId,
        name: categoryDoc.name,
        parentId,
        nBooks: categoryDoc.nBooks,
        message: 'created category successfully',
        dateCreated: categoryDoc.dateCreated,
        dateCreated: categoryDoc.dateModified,
        retrieveAllCategories: `${baseUrl}/categories`,
	      retrieveCategory: `${baseUrl}/category/<:id>`,
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error',
        detail: error.message,
      });
    }
  }

  static async getCategory(req, res) {
    // TODO:
  }

  static async getCategories(req, res) {
    // TODO:
  }

  static  async modifyCategory(req, res) {
    // TODO:
  }

  static async deleteCategory(req, res) {
    // TODO:
  }
}

module.exports = CategoryController;
