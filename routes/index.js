const { Router } = require('express');
const UserController = require('../controllers/UserController');
const BookshelfController = require('../controllers/BookshelfController');
const CategoryController = require('../controllers/CategoryController');
const BookController = require('../controllers/BookController');

const protectedRoutes = Router();
BookshelfController;
/**
 * User route
 */
protectedRoutes.get('/user/me', async (req, res) => {
  await UserController.profile(req, res);
});

/**
 * Bookshelfs routes
 */
protectedRoutes.post('/bookshelfs', async (req, res) => {
  await BookshelfController.createBookshelf(req, res);
});

protectedRoutes.get('/bookshelfs/:id', async (req, res) => {
  await BookshelfController.getBookshelf(req, res);
});

protectedRoutes.get('/bookshelfs', async (req, res) => {
  await BookshelfController.getBookshelfs(req, res);
});

protectedRoutes.put('/bookshelfs/:id', async (req, res) => {
  await BookshelfController.modifyBookshelf(req, res);
});

protectedRoutes.delete('/bookshelfs/:id', async (req, res) => {
  await BookshelfController.deleteBookshelf(req, res);
});

/**
 * Book cateogry routes
 */
protectedRoutes.post('/categories', async (req, res) => {
  await CategoryController.createCategory(req, res);
});

protectedRoutes.get('/categories/:id', async (req, res) => {
  await CategoryController.getCategory(req, res);
});

protectedRoutes.get('/categories', async (req, res) => {
  await CategoryController.getCategories(req, res);
});

protectedRoutes.put('/categories/:id', async (req, res) => {
  await CategoryController.modifyCategory(req, res);
});

protectedRoutes.delete('/categories/:id', async (req, res) => {
  await CategoryController.deleteCategory(req, res);
});

/**
 * Book routes
 */
protectedRoutes.post('/books', async (req, res) => {
  await BookController.createBook(req, res);
});

protectedRoutes.get('/books/:id', async (req, res) => {
  await BookController.getBook(req, res);
});

protectedRoutes.get('/books', async (req, res) => {
  await BookController.getBooks(req, res);
});

protectedRoutes.put('/books/:id', async (req, res) => {
  await BookController.modifyBook(req, res);
});

protectedRoutes.delete('/books/:id', async (req, res) => {
  await BookController.deleteBook(req, res);
});

module.exports = protectedRoutes;
