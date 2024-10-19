const chai = require('chai');
const chaiHttp = require('chai-http');
const request = require('request');
const sinon = require('sinon');
const Utils = require('../../utils/Utils');
const BookController = require('../../controllers/BookController');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Book Controller Endpoints Testing', () => {
  let stubMiddleWare;
  const serverBaseUrl = 'http://127.0.0.1:5000/api/v1';
  const bookshelfIds = {
    bookshelf001: {
      id: 'bookshelf001',
      categoryIds: ['975ed90f0fd873a321d2bf3ed', '975ed90f0fd873a321d2bf3de'],
    },
    bookshelf002: {
      id: 'bookshelf002',
      categoryIds: ['976ed90f0fd873a321d2bf3ed', '977ed90f0fd873a321d2bf3de'],
    },
  };

  before(() => {
    stubMiddleWare = sinon
      .stub(Utils, 'authentication')
      .callsFake((req, res, next) => {
        req.headers['X-User'] = 'jwt';
        next();
      });
  });
  after(() => {
    stubMiddleWare.restore();
  });

  describe('Tests POST /api/v1/book', () => {
    let stubBook;
    let bookPostData;
    let bookPostDataNoBookshelf;
    let bookPostDataWrongCategory;

    beforeEach(() => {
      bookPostData = {
        url: `${serverBaseUrl}/book`,
        json: {
          name: 'The cave of a million eye',
          author: 'Egele Michael',
          publishedInYear: 2020,
          numberOfPages: 107,
          categoryId: '975ed90f0fd873a321d2bf3ed',
          bookshelfId: 'bookshelf001',
        },
      };
      bookPostDataNoBookshelf = {
        url: `${serverBaseUrl}/book`,
        json: {
          name: 'The cave of a million eye',
          author: 'Egele Michael',
          publishedInYear: 2020,
          numberOfPages: 107,
          categoryId: '975ed90f0fd873a321d2bf3ed',
        },
      };
      bookPostDataWrongCategory = {
        url: `${serverBaseUrl}/book`,
        json: {
          name: 'The cave of a million eye',
          author: 'Egele Michael',
          publishedInYear: 2020,
          numberOfPages: 107,
          categoryId: 'nonexistingCategory',
          bookshelfId: 'bookshelf001',
        },
      };

      stubBook = sinon
        .stub(BookController, 'createBook')
        .callsFake((req, res) => {
          res.set('Content-Type', 'application/json');
          const categoryId = req?.body?.categoryId;
          const bookshelfId = req?.body?.bookshelfId;

          if (!bookshelfId) {
            return res.status(400).send({
              error: 'Bookshelf\'s ID can not be missing',
            });
          }

          if (!bookshelfIds[bookshelfId]) {
            return res.status(400).send({
              error: 'Invalid bookshelf',
            });
          }

          if (categoryId) {
            if (!bookshelfIds[bookshelfId].categoryIds.includes(categoryId)) {
              return res.status(400).send({
                error: 'Invalid category\'s ID',
              });
            }
          }
          return res.status(201).send({
            id: 'qwerty-123-456-7890',
            name: req.body.name,
            author: req.body.author,
            publishedInYear: req.body.publishedInYear,
            numberOfPages: req.body.numberOfPages,
            bookshelfId,
            categoryId,
            bookPath: '/bookshelf/books',
            dateCreated: 'Thursday 18, October, 2024',
            dateModified: 'Thursday 18, October, 2024',
            reriveAllBooks: `${serverBaseUrl}/books`,
            retrieveBook: `${serverBaseUrl}/book/<id>`,
          });
        });
    });

    afterEach(() => {
      stubBook.restore();
    });

    it('is the endpoint returning expected status', (done) => {
      request.post(bookPostData, (err, res, body) => {
        if (err) return done(err);
        expect(body).to.have.property('id', 'qwerty-123-456-7890');
        done();
      });
    });

    it('is a missing bookshelf\'s ID checked', (done) => {
      request.post(bookPostDataNoBookshelf, (err, res, body) => {
        if (err) return done(err);
        expect(body).to.have.property(
          'error',
          'Bookshelf\'s ID can not be missing'
        );
        done();
      });
    });

    it('is an invalid category\'s id checked', (done) => {
      request.post(bookPostDataWrongCategory, (err, res, body) => {
        if (err) return done(err);
        expect(body).to.have.property('error', 'Invalid category\'s ID');
        done();
      });
    });

    it('does the body contain the id of the created book', (done) => {
      request.post(bookPostData, (err, res, body) => {
        if (err) return done(err);
        expect(body).to.have.property('id', 'qwerty-123-456-7890');
        done();
      });
    });
  });

  describe('Tests GET /api/v1/book/<id>', () => {
    let stubBook;
    let bookGetData;
    let bookGetDataNoBookshelfId;

    beforeEach(() => {
      bookGetData = {
        url: `${serverBaseUrl}/book/67117af4183a53cf798f0bf2`,
        json: {
          bookshelfId: 'bookshelf002',
          categoryId: '976ed90f0fd873a321d2bf3ed',
        },
      };

      bookGetDataNoBookshelfId = {
        url: `${serverBaseUrl}/book/67117af4183a53cf798f0bf2`,
        json: {
          categoryId: '976ed90f0fd873a321d2bf3ed',
        },
      };

      stubBook = sinon.stub(BookController, 'getBook').callsFake((req, res) => {
        res.set('Content-Type', 'application/json');
        const categoryId = req?.body?.categoryId;
        const bookshelfId = req?.body?.bookshelfId;

        if (!req.params.id) {
          return res.status(400).send({
            error: 'Book\'s ID can not be missing',
          });
        }
        if (!bookshelfId) {
          return res.status(400).send({
            error: 'Book\'s bookshelf can not be missing',
          });
        }
        if (
          categoryId &&
          !bookshelfIds[bookshelfId].categoryIds.includes(categoryId)
        ) {
          return res.status(400).send({
            error: 'Invalid category\'s ID',
          });
        }
        return res.status(200).send({
          id: 'qwerty-123-456-7890',
          name: 'The cave of a million eye',
          author: 'Egele Michael',
          publishedInYear: 202,
          numberOfPages: 73,
          bookshelfId: 'bookshelf002',
          categoryId: '976ed90f0fd873a321d2bf3ed',
          bookPath: '/bookshelf/books/testBook.pdf',
          dateCreated: 'Thursday 18, October, 2024',
          dateModified: 'Thursday 18, October, 2024',
          reriveAllBooks: `${serverBaseUrl}/books`,
          createBook: `${serverBaseUrl}/book`,
        });
      });
    });

    afterEach(() => {
      stubBook.restore();
    });

    it('is the endpoint reachable', (done) => {
      request.get(bookGetData, (err, res, body) => {
        if (err) return done(err);
        expect(res).to.have.status(200);
        done();
      });
    });

    it('is request checked for missing book\'s ID', (done) => {
      request.get(bookGetDataNoBookshelfId, (err, res, body) => {
        if (err) return done(err);
        expect(body).to.have.property('error', 'Book\'s bookshelf can not be missing');
        done();
      });
    });
  });

  describe('Tests GET /api/v1/books', () => {
    let stubBook;
    let bookGetData;
    let bookGetDataNoBookshelfId;

    beforeEach(() => {
      bookGetData = {
        url: `${serverBaseUrl}/books`,
        json: {
          bookshelfId: 'bookshelf001',
          categoryId: '975ed90f0fd873a321d2bf3de',
        }
      };

      bookGetDataNoBookshelfId = {
        url: `${serverBaseUrl}/books`,
        json: {
          categoryId: '975ed90f0fd873a321d2bf3de',
        }
      };
      
      stubBook = sinon.stub(BookController, 'getBooks')
        .callsFake((req, res) => {
          res.set('Content-Type', 'application/json');

          const bookshelfId = req.body.bookshelfId;
          if (!bookshelfId) {
            return res.status(400).json({
              error: 'Bookshelf\'s ID can not be missing',
            });
          }

          const categoryId = req.body.categoryId;
          const isCategoryInBookshelf = bookshelfIds[bookshelfId]
            .categoryIds.includes(categoryId);
          if (categoryId && !isCategoryInBookshelf) {
            return res.status(400).json({
              error: 'Category is not located in a given bookshelf',
            });
          }

          return res.status(200).send({
            books: [
              {
                id: 'qwerty-123-456-7890',
                name: 'The cave of a million eye',
                author: 'Egele Michael',
                publishedInYear: 202,
                numberOfPages: 73,
                bookshelfId: 'bookshelf002',
                categoryId: '976ed90f0fd873a321d2bf3ed',
                bookPath: '/bookshelf/books/testBook.pdf',
                dateCreated: 'Thursday 18, October, 2024',
                dateModified: 'Thursday 18, October, 2024',
              },
              {
                id: 'qwerty-123-456-7890',
                name: 'The cave of a million eye',
                author: 'Egele Michael',
                publishedInYear: 202,
                numberOfPages: 73,
                bookshelfId: 'bookshelf002',
                categoryId: '976ed90f0fd873a321d2bf3ed',
                bookPath: '/bookshelf/books/testBook.pdf',
                dateCreated: 'Thursday 18, October, 2024',
                dateModified: 'Thursday 18, October, 2024',
              }
            ],
            currentPage: 1,
            previousPage: null,
            nextPage: null,
            retrieveBook: `${serverBaseUrl}/book/<id>`,
            removeBook: `${serverBaseUrl}/book/<id>`,
          });
        });
    });

    afterEach(() => {
      stubBook.restore();
    });

    it('is the endpoint reachable', (done) => {
      request.get(bookGetData, (err, res, body) => {
        if (err) return done(err);
        expect(res).to.have.status(200);
        done();
      });
    });

    it ('is the body contain the book documents', (done) => {
      request.get(bookGetData, (err, res, body) => {
        if (err) return done(err);
        expect(body.books).to.be.an('array');
        expect(body.books.length > 0).to.be.true;
        done();
      });
    });

    it('is a missing bookshelf request returned with error', (done) => {
      request.get(bookGetDataNoBookshelfId, (err, rea, body) => {
        if (err) return done(err);
        expect(body).to.have.property('error', 'Bookshelf\'s ID can not be missing');
        done();
      });
    });
  });

  describe('Tests PUT /api/v1/book/<id>', () => {
    let stubBook;
    let bookPutData;
    let bookPutDataNoBookshelfId;

    bookPutData = {
      url: `${serverBaseUrl}/book/67117af4183a53cf798f0bf2`,
      json: {
        name: 'New Name',
        author: 'Corrected Author\'s Name',
        publishedInYear: 2023,
        numberOfPages: 93,
        bookshelfId: 'bookshelf001',
        categoryId: '975ed90f0fd873a321d2bf3ed',
      },
    };

    bookPutDataNoBookshelfId = {
      url: `${serverBaseUrl}/book/67117af4183a53cf798f0bf2`,
      json: {
        name: 'New Name',
        author: 'Corrected Author\'s Name',
        publishedInYear: 2023,
        numberOfPages: 93,
        categoryId: '975ed90f0fd873a321d2bf3ed',
      },
    };

    beforeEach(() => {
      stubBook = sinon.stub(BookController, 'modifyBook')
        .callsFake((req, res) => {
          res.set('Content-Type', 'application/json');
          const categoryId = req?.body?.categoryId;
          const bookshelfId = req?.body?.bookshelfId;

          if (!bookshelfId) {
            return res.status(400).send({
              error: 'Bookshelf\'s ID can not be missing',
            });
          }

          if (!bookshelfIds[bookshelfId]) {
            return res.status(400).send({
              error: 'Invalid bookshelf',
            });
          }

          if (categoryId) {
            if (!bookshelfIds[bookshelfId].categoryIds.includes(categoryId)) {
              return res.status(400).send({
                error: 'Invalid category\'s ID',
              });
            }
          }

          return res.status(200).send({
            id: 'qwerty-123-456-7890',
            name: req.body.name,
            author: req.body.author,
            publishedInYear: req.body.publishedInYear,
            numberOfPages: req.body.numberOfPages,
            bookshelfId,
            categoryId: categoryId? categoryId : null,
            bookPath: '/bookshelf/books/test001.pdf',
            dateCreated: 'Friday 18, October, 2024',
            dateModified: 'Saturday 19, October, 2024',
            retrieveBook: `${serverBaseUrl}/book/<id>`,
            removeBook: `${serverBaseUrl}/book/<id>`,
          });          
        });
    });

    afterEach(() => {
      stubBook.restore();
    });

    it('is the endpoint reachable', (done) => {
      request.put(bookPutData, (err, res, body) => {
        if (err) return done(err);
        expect(res).to.have.status(200);
        done();
      });
    });

    it('does endpoint return expected data', (done) => {
      request.put(bookPutData, (err, res, body) => {
        if (err) return done(err);
        expect(body).to.have.property('name', 'New Name');
        expect(body).to.have.property('author', 'Corrected Author\'s Name');
        expect(body.publishedInYear === 2023).to.be.true;
        expect(body.numberOfPages === 93).to.be.true;
        const bookshelfId = body.bookshelfId;
        const categoryId = body.categoryId;
        expect(bookshelfIds[bookshelfId].categoryIds.includes(categoryId)).to.be.true;
        done();
      });
    });

    it('is a missing bookshelf detected', (done) => {
      request.put(bookPutDataNoBookshelfId, (err, res, body) => {
        if (err) return done(err);
        expect(body).to.have.property('error', 'Bookshelf\'s ID can not be missing');
        done();
      });
    });

    it('does the endpoint return a correct status for bad requests', (done) => {
      request.put(bookPutDataNoBookshelfId, (err, res, body) => {
        if (err) return done(err);
        expect(res).to.have.status(400);
        done();
      });
    });
  });

  describe('Tests DELETE /api/v1/book', () => {
    let stubBook;
    let bookDeleteData;
    let bookDeleteDataNoBookshelf;

    bookDeleteData = {
      url: `${serverBaseUrl}/book/67117af4183a53cf798f0bf2`,
      json: {
        bookshelfId: 'bookshelf001',
        categoryId: '975ed90f0fd873a321d2bf3ed', 
      }
    };

    bookDeleteDataNoBookshelf = {
      url: `${serverBaseUrl}/book/67117af4183a53cf798f0bf2`,
      json: {
        categoryId: '975ed90f0fd873a321d2bf3ed', 
      }
    };

    beforeEach(() => {
      stubBook = sinon.stub(BookController, 'deleteBook')
        .callsFake((req, res) => {
          res.set('Content-Type', 'application/json');
          if (!req.params.id) {
            return res.status(400).json({
              error: 'Book\'s ID can not be missing',
            });
          }
          const bookshelfId = req?.body?.bookshelfId;
          if (!bookshelfId) {
            return res.status(400).json({
              error: 'Bookshelf\'s ID can not be missing',
            });
          }
          const categoryId = req?.body?.categoryId;
          if (categoryId &&
            !bookshelfIds[bookshelfId]?.categoryIds.includes(categoryId)
          ) {
            return res.status(400).json({
              error: 'Invalid categoryId'
            });
          }

          return res.status(201).json({});
        });
    });

    afterEach(() => {
      stubBook.restore();
    });

    it('is the endpoint reachable', (done) => {
      request.delete(bookDeleteData, (err, res, body) => {
        if (err) return done(err);
        expect(res).to.have.status(201);
        done();
      });
    });

    it('is the content type correct', (done) => {
      request.delete(bookDeleteData, (err, res, body) => {
        if (err) return done(err);
        expect(res).to.have.header('Content-Type', 'application/json; charset=utf-8');
        done();
      });
    });

    it('is there no body returned', (done) => {
      request.delete(bookDeleteData, (err, res, body) => {
        if (err) return done(err);
        expect(Object.keys(body).length).to.be.equal(0);
        done();
      });
    });

    it('is a missing bookshelf detected', (done) => {
      request.delete(bookDeleteDataNoBookshelf, (err, res, body) => {
        if (err) return done(err);
        expect(body).to.have.property('error', 'Bookshelf\'s ID can not be missing');
        done();
      })
    })
  });
});
