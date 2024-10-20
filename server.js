require('dotenv').config();
const express = require('express');
const mime = require('mime-types');
const protectedRoutes = require('./routes/index');
const AppController = require('./controllers/AppController');
const UserController = require('./controllers/UserController');
const Utils = require('./utils/Utils');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./documentation/swagger.json');


const app = express();
const port = process.env.EXP_PORT;
app.use(express.json());

/**
 * The Application route
 */
app.get('/api/v1/status', async (req, res) => {
  await AppController.getServerState(req, res);
});

/**
 * User unprotected routes
 */
app.post('/api/v1/user/register', async (req, res) => {
  await UserController.registerUser(req, res);
});

app.post('/api/v1/user/login', async (req, res) => {
  await UserController.login(req, res);
});

app.post('/api/v1/user/logout', async (req, res) => {
  await UserController.logout(req, res);
});

/**
 * Entrance to all protect routes
 */
app.use(
  '/api/v1',
  async (req, res, next) => {
    await Utils.authentication(req, res, next);
  },
  protectedRoutes
);

/**
 * Swagger entry point
 */
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

/**
 * Request error handler
 */
app.use((err, req, res, next) => {
  res.set('Content-Type', mime.contentType('json'));
  if (err) {
    return res.status(400).json({
      error: err.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://127.0.0.1:${port}`);
});

module.exports = app;
