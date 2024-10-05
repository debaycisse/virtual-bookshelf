const { Router } = require('express');
const AppController = require('../controllers/AppController');

const routes = Router();

routes.get('/api/v1/status', async (req, res) => {
  await AppController.getServerState(req, res);
});

module.exports = routes;
