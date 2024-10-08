const { Router } = require('express');
const AppController = require('../controllers/AppController');
const UserController = require('../controllers/UserController');

const routes = Router();

routes.get('/status', async (req, res) => {
  await AppController.getServerState(req, res);
});

routes.post('/user/register', async (req, res) => {
  await UserController.registerUser(req, res);
});

routes.post('/user/login', async (req, res) => {
  await UserController.login(req, res);
});

module.exports = routes;
