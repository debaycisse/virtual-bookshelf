const { Router } = require('express');
const UserController = require('../controllers/UserController');
<<<<<<< HEAD
const ShelveController = require('../controllers/ShelveController');
=======
const Utils = require('../utils/Utils');
>>>>>>> 2b0e78b3dc2ab4ba0734c4bcfea104f10b31860b

const protectedRoutes = Router();

protectedRoutes.get('/user/me', async (req, res) => {
  await UserController.profile(req, res);
});

module.exports = protectedRoutes;
