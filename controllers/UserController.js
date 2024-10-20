const uuid = require('uuid');
const mongoDbClient = require("../utils/mongo");
const mime = require('mime-types');
const Utils = require("../utils/Utils");
const redisClient = require('../utils/redis');

const serverBaseUrl = 'http://127.0.0.1:5000/api/v1';

class UserController{
  /**
   * Creates a new user, stores it in the database, and
   * returns a success message
   * 
   * @param {*} req - URL's request object
   * @param {*} res - URL's response object
   * @returns a success message upon successful operation
   */
  static async registerUser(req, res) {
    /**
     * Sets a content type for the response object
     */
    res.setHeader('Content-Type', mime.contentType('json'));

    /**
     * Checks connection to the database and cache database
     */
    await Utils.checkConnection(res);

    /**
     * Retrieves a new user's data and validates them for correctness
     */
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

    /**
     * Hashes a given password and stores the user's data into the database
     */
    const hashedPwd = await Utils.hashPassword(password);
    const userObj = {
      name,
      email,
      password: hashedPwd,
      dateCreated: new Date().toLocaleString(),
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

  /**
   * Logs an existing user into the system by providing a login token
   * to the user. The login token can be used for subsequent request.
   * 
   * @param {*} req - URL's request object
   * @param {*} res - URL's response object
   * @returns Upon successful operation, login token is returned
   */
  static async login(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    /**
     * Checks connection to the database and cache database
     */
    await Utils.checkConnection(res);

    /**
     * Retrieves user's credentials and validates them
     */
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

    const isValidPassword = await Utils
      .authenticatesPassword(password, userObj.password);

    if (!isValidPassword) {
      return res.status(400).json({
        error: 'Bad request',
        detail: 'invalid email or password',
      });
    }

    /**
     * Generates a token for user's data
     */
    const jwtToken = await Utils.generateToken(userObj);

    if (!jwtToken) {
      return res.status(500).json({
        error: 'Internal server error',
        detail: 'failed to generate token',
      });
    }

    /**
     * Cache the generated token and generates a login token
     */
    const userToken = String(uuid.v4());
    const storeSession = redisClient.storeJwt(userToken, jwtToken);

    if (!storeSession) {
      return res.status(500).json({
        error: 'Internal server error',
        detail: 'failed to store session data',
      });
    }

    /**
     * Pass along the generated login token to the response header and
     * return success message to indicate success operation status
     */
    res.setHeader('X-Token', userToken);
    return res.status(200).json({
      message: 'login was successful',
      token: userToken,
      logoutEndpoint: `${serverBaseUrl}/user/logout`,
    });
  }

  /**
   * Logs an exisitng user out of the system
   * 
   * @param {*} req - URL's request object
   * @param {*} res - URL's response object
   * @returns a success message to indicate a successful operation status
   */
  static async logout(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    /**
     * Checks connection to the database and cache database
     */
    await Utils.checkConnection(res);

    /**
     * Removes user from cache and tracks operation's status
     */
    const isDeleted = await Utils.delSessionToken(req);
    
    if (isDeleted === 'No token was found') {
      return res.status(400).json({
        error: 'logout failure',
        detail: 'Invalid login token',
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

  /**
   * Retrieves a user's data from the database
   * 
   * @param {*} req - URL's request object
   * @param {*} res - URL's response object
   * @returns an object that contains a given user's data
   */
  static async profile(req, res) {
    res.setHeader('Content-Type', mime.contentType('json'));
    /**
     * Checks connection to the database and cache database
     */
    await Utils.checkConnection(res);

    /**
     * Validates a user's header for an expected X-User header.
     * The header contains a user's data
     */
    if (!req.headers['X-User']) {
      return res.status(400).json({
        error: 'user\'s data is missing'
      });
    }

    const userData = await Utils.extractJwt(req.headers['X-User']);
    const parentId = userData?._id;

    let nBooks = 0;
    try {
      /**
       * Obtains all bookshelfs, owned by current user and obtain each
       * category, owned by each bookshelf
       */
      const allBookshelfsForUser = await Utils.bookshelfsByUserId(parentId);
      if (allBookshelfsForUser.length > 0) {
        for (const bookshelf of allBookshelfsForUser) {
          const nDoc = await mongoDbClient.countDoc(bookshelf._id, 'book');
          nBooks += nDoc;
        }
      }
    } catch (error) {
      return nBooks;
    }

    let nCategories = 0;
    try {
      /**
       * Obtains all bookshelfs, owned by current user and obtain each
       * category, owned by each bookshelf
       */
      const allBookshelfsForUser = await Utils.bookshelfsByUserId(parentId);
      if (allBookshelfsForUser.length > 0) {
        for (const bookshelf of allBookshelfsForUser) {
          const nDoc = await mongoDbClient.countDoc(bookshelf._id, 'category');
          nCategories += nDoc;
        }
      }
    } catch (error) {
      nCategories = 0;
    }

    let nShelves;
    try {
      nShelves = await mongoDbClient.countDoc(parentId, 'bookShelf');
    } catch (error) {
      nShelves = 0;
    }

    return res.status(200).json({
      name: userData.name,
      registrationDate: userData.dateCreated,
      numOfBooks: nBooks,
      numOfBookCategories: nCategories,
      numOfBookshelfs: nShelves,
    });
  }
}

module.exports = UserController;
