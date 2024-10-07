const { Router } = require('express');
const AppController = require('../controllers/AppController');
const UserAuthentication = require('../controllers/UserAuthentication');

const routes = Router();

routes.get('/api/v1/status', async (req, res) => {
  await AppController.getServerState(req, res);
});

routes.post('/api/v1/user/register', async (req, res) => {
  await UserAuthentication.registerUser(req, res);
});

module.exports = routes;
