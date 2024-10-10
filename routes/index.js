const { Router } = require('express');
const UserController = require('../controllers/UserController');
const ShelveController = require('../controllers/ShelveController');
const Utils = require('../utils/Utils');

const protectedRoutes = Router();

/**
 * handles the retrieval of a user's profile data
 */
protectedRoutes.get('/user/me', async (req, res) => {
  await UserController.profile(req, res);
});

/**
 * handles the creation of a new virtual shelve
 */
protectedRoutes.post('/shelve', async (req, res) => {
  await ShelveController.createShelve(req, res);
});

/**
 * handles the retrieval of the existing virtual shelve for a user
 */
protectedRoutes.get('/shelve', async (req, res) => {
  await ShelveController.getShelve(req, res);
});

/**
 * handles the altering of an existing shelve of a user
 */
protectedRoutes.put('/shelve', async (req, res) => {
  await ShelveController.modifyShelve(req, res);
})

/**
 * handles the deletion of an existing shelf and its contained
 */
protectedRoutes.delete('shelve', async (req, res) => {
  await ShelveController.deleteShelve(req, res);
});

module.exports = protectedRoutes;
