require('dotenv').config();
const express = require('express');
const protectedRoutes = require('./routes/index');
const AppController = require('./controllers/AppController');
const UserController = require('./controllers/UserController');
const Utils = require('./utils/Utils');

const app = express();
const port = process.env.EXP_PORT;
app.use(express.json());

app.get('/api/v1/status', async (req, res) => {
  await AppController.getServerState(req, res);
});

app.post('/api/v1/user/register', async (req, res) => {
  await UserController.registerUser(req, res);
});

app.post('/api/v1/user/login', async (req, res) => {
  await UserController.login(req, res);
});

app.post('/api/v1/user/logout', async (req, res) => {
  await UserController.logout(req, res);
});

app.use(
  '/api/v1',
  async (req, res, next) => {
    await Utils.authentication(req, res, next);
  },
  protectedRoutes
);

app.listen(port, () => {
  console.log(`Server running at http://127.0.0.1:${port}`);
});

module.exports = app;
