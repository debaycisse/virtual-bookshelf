const { Router } = require('express');
const UserController = require('../controllers/UserController');
const BookshelfController = require('../controllers/BookshelfController');

const protectedRoutes = Router();
BookshelfController;
protectedRoutes.get('/user/me', async (req, res) => {
  await UserController.profile(req, res);
});

protectedRoutes.post('/bookshelf', async (req, res) => {
  await BookshelfController.createBookshelf(req, res);
});

protectedRoutes.get('/bookshelf/:id', async (req, res) => {
  await BookshelfController.getBookshelf(req, res);
});

protectedRoutes.get('/bookshelfs', async (req, res) => {
  await BookshelfController.getBookshelfs(req, res);
});

protectedRoutes.put('/bookshelf/:id', async (req, res) => {
  await BookshelfController.modifyBookshelf(req, res);
});

protectedRoutes.delete('/bookshelf/:id', async (req, res) => {
  await BookshelfController.deleteBookshelf(req, res);
});

module.exports = protectedRoutes;
