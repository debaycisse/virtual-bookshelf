const uuid = require('uuid');
const mongoDbClient = require("../utils/mongo");
const mime = require('mime-types');
const Utils = require("../utils/Utils");
const redisClient = require('../utils/redis');

const serverBaseUrl = 'http://127.0.0.1:5000/api/v1';

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

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Bad request',
        detail: 'email, password, and name must be provided',
      });
    }

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
      dateCreated: new Date().toUTCString(),
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
      acknowledged: newUserDoc.acknowledged,
      loginEndpoint: `${serverBaseUrl}/user/login`,
    });
  }

  static async login(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad request',
        detail: 'email and password must be provided',
      });
    }

    if (!Utils.validateEmail(email)) {
      return res.status(400).json({
        error: 'Bad request',
        detail: 'provided email is not valid',
      });
    }

    const user = await Utils.findUserByEmail(email);
    const userObj = JSON.parse(user);

    if (!userObj) {
      return res.status(400).json({
        error: 'Bad request',
        detail: 'invalid email or password',
      });
    }

    const isValidPassword = await Utils.authenticatesPassword(password, userObj.password);

    if (!isValidPassword) {
      return res.status(400).json({
        error: 'Bad request',
        detail: 'invalid email or password',
      });
    }

    const jwtToken = await Utils.generateToken(userObj);

    if (!jwtToken) {
      return res.status(500).json({
        error: 'Internal server error',
        detail: 'failed to generate token',
      });
    }

    const userToken = String(uuid.v4());
    const storeSession = redisClient.storeJwt(userToken, jwtToken);

    if (!storeSession) {
      return res.status(500).json({
        error: 'Internal server error',
        detail: 'failed to store session data',
      });
    }

    res.setHeader('X-Token', userToken);
    return res.status(200).json({
      message: 'login was successful',
      token: userToken,
      logoutEndpoint: `${serverBaseUrl}/user/logout`,
    });
  }

  static async logout(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));

    const isDeleted = await Utils.delSessionToken(req);
    
    if (isDeleted === 'No token was found') {
      return res.status(400).json({
        error: 'logout failure',
        detail: 'No token was found',
      });
    }
    if (isDeleted === 'Authorization header is missing') {
      return res.status(400).json({
        error: 'logout failure',
        detail: 'Authorization header is missing',
      });
    }
    if (isDeleted === 'Invalid or expired token') {
      return res.status(400).json({
        error: 'logout failure',
        detail: 'Invalid or expired token',
      });
    }
    if (isDeleted !== 'deleted') {
      return res.status(500).json({
        error: 'server log out failure',
        detail: 'Could not logout',
      });
    }
    return res.status(200).json({
      message: 'logged out successfully',
    });
  }

  static async profile(err, req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));

    if (err) {
      return res.status(400).json({
        error: 'authentication error',
        detail: err.message,
      });
    }

    if (!req.headers['X-User']) {
      return res.status(400).json({
        error: 'user\'s data is missing'
      });
    }

    const nBooks = await mongoDbClient.countDoc(parentId, 'book');
    const nCategories = await mongoDbClient.countDoc(parentId, 'category');
    const nShelves = await mongoDbClient.countDoc(parentId, 'shelve');
    const userData = await Utils.extractJwt(req.headers['X-User']);

    return res.status(200).json({
      name: userData.name,
      registrationDate: userData.dateCreated,
      numOfBooks: nBooks,
      numOfBookCategories: nCategories,
      numOfShelves: nShelves,
    });
  }
}

module.exports = UserController;
