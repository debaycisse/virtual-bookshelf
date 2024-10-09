const { Router } = require('express');
const UserController = require('../controllers/UserController');
const Utils = require('../utils/Utils');

const protectedRoutes = Router();

protectedRoutes.get('/user/me', async (req, res) => {
  await UserController.profile(req, res);
});

module.exports = protectedRoutes;
