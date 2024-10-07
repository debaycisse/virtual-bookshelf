const mongoDbClient = require("../utils/mongo");
const mime = require('mime-types');
const Utils = require("../utils/Utils");

class UserController{
  static async registerUser(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    const isAvailableMongo = await mongoDbClient.isAvailable();

    if (!isAvailableMongo) {
      return res.status(500).json({
        status: 'Server not available',
        detail: 'Mongo DB is not connected',
      });
    }
    const {  name, email, password, } = req.body;
    const docType = 'user'

    if (!Utils.validateEmail(email)) {
      return res.status(400).json({
        error: 'Bad request',
        detail: 'provided email is not valid',
      });
    }

    if (!Utils.validatePassword(password)) {
      return res.status(400).json({
        error: 'Bad request',
        detail: 'password must be minumum of 8 characters and alphanumeric',
      });
    }

    const hashedPwd = await Utils.hashPassword(password);
    const userObj = {
      name,
      email,
      password: hashedPwd,
    };
    const newUserDoc = await Utils.storeDoc(docType, userObj);
    if (!newUserDoc) {
      return res.status(500).json({
        error: 'Internal server error',
        detail: 'New user counld not be created',
      });
    }
    return res.status(201).json({
      message: 'user created successfully',
      dateCreated: newUserDoc.dateCreated.toUTCString(),
      loginEndpoint: 'http://127.0.0.1:5000/api/v1/user/login',
    });
  }
}

module.exports = UserController;
