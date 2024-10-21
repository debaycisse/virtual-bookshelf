const chai = require('chai');
const chaiHttp = require('chai-http');
const request = require('request');
const sinon = require('sinon');
const BookshelfController = require('../../controllers/BookshelfController');
const Utils = require('../../utils/Utils');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Bookshelf Controller Endpoints Testing', () => {
  let stubMiddleWare;
  const serverBaseUrl = 'http://127.0.0.1:5000/api/v1';

  before(() => {
    stubMiddleWare = sinon.stub(Utils, 'authentication')
      .callsFake((req, res, next) => {
        req.headers['X-User'] = 'jwt';
        next();
      });
  });
  after(() => {
    stubMiddleWare.restore();
  });

  describe('Tests POST /api/v1/bookshelfs', () => {
    let stubBookshelf;
    const bookshelfPostData = {
      url: `${serverBaseUrl}/bookshelfs`,
      json: {
        name: 'My Virtual Bookshelf',
      },
    };

    beforeEach(() => {
      stubBookshelf = sinon.stub(BookshelfController, 'createBookshelf')
        .callsFake((req, res) => {
          res.set('Content-Type', 'application/json');
          res.status(201).send({
            acknowledge: true,
            id: 'qwerty-123-456-7890',
            name: req.body.name,
            ownerId: 'poiuyt-098765-4321',
            message: 'created bookshelf successfully',
            authenticationHeader: req.headers['X-User'] || null,
            dateCreated: 'Thursday 10, October, 2024',
            retrieveBookshelfsEndpoint: 'http://127.0.0.1/api/v1/bookshelfs',
            retrieveBookshelfEndpoint: 'http://127.0.0.1/api/v1/bookshelfs/<:id>',
          });
        });
    });

    afterEach(() => {
      stubBookshelf.restore();
    });

    it('is the status code correct', (done) => {
      request.post(bookshelfPostData, (err, res, body) => {
        if (err) return done(err);
        expect(res).to.have.status(201);
        done();
      });    
    });

    it('is the authentication correct', (done) => {
      request.post(bookshelfPostData, (err, res, body) => {
        if (err) return done(err);
        expect(body.authenticationHeader === 'jwt').to.be.true;
        done();
      });
    });

    it('is the owner\' id available', (done) => {
      request.post(bookshelfPostData, (err, res, body) => {
        if (err) return done(err);
        expect(body.ownerId === 'poiuyt-098765-4321').to.be.true;
        done();
      });
    });

    it('is a name provided for the virtual bookshelf', (done) => {
      request.post(bookshelfPostData, (err, res, body) => {
        if (err) return done(err);
        expect(body).to.have.property('name', 'My Virtual Bookshelf');
        done();
      });
    });
  });

  describe('Tests GET /api/v1/bookshelf/:id', () => {
    let stubBookshelf;
    const requestData = {
      url: `${serverBaseUrl}/bookshelfs/670a46ccd9341f13294c2da5`,
      json: {},
    };

    beforeEach(() => {
      stubBookshelf = sinon.stub(BookshelfController, 'getBookshelf')
        .callsFake((req, res) => {
          res.set('Content-Type', 'application/json');
          res.status(200).send({
            id: 'qwerty-123-456-7890',
            name: 'My Virtual Bookshelf',
            ownerId: 'poiuyt-098765-4321',
            dateCreated: 'Thursday 10, October, 2024',
            retrieveAllBookshelfs: 'http://127.0.0.1/api/v1/bookshelfs',
            removeBookshelf: 'http://127.0.0.1/api/v1/bookshelfs/<:id>',
          });
        });
    });

    afterEach(() => {
      stubBookshelf.restore();
    });

    it('is the endpoint reachable', (done) => {
      request.get(requestData, (err, res, body) => {
        if (err) return done(err);
        expect(res).to.have.status(200);
        done();
      });
    });
  });

  describe('Tests GET /api/v1/bookshelfs', (done) => {
    let stubBookshelf;
    const requestData = {
      url: `${serverBaseUrl}/bookshelfs`,
      json: {},
    }

    beforeEach(() => {
      stubBookshelf = sinon.stub(BookshelfController, 'getBookshelfs')
        .callsFake((req, res) => {
          res.set('Content-Type', 'application/json');
          res.status(200).send({
            bookshelfs: [
              {
                id: 'qwerty-123-456-7890',
                name: 'My Virtual Bookshelf',
                ownerId: 'poiuyt-098765-4321',
                dateCreated: 'Thursday 10, October, 2024',
              },
              {
                id: 'ytrewq-321-654-0987',
                name: 'My Virtual Bookshelf 3333',
                ownerId: 'poiuyt-098765-4321',
                dateCreated: 'Thursday 12, October, 2024',
              }
            ],
            retrieveBookshelf: 'http://127.0.0.1/api/v1/bookshelfs/<:id>',
            removeBookshelf: 'http://127.0.0.1/api/v1/bookshelfs/<:id>',
          });
        });
    });

    afterEach(() => {
      stubBookshelf.restore();
    })

    it('is the endpoint reachable', (done) => {
      request.get(requestData, (err, res, body) => {
        if (err) return done(err);
        expect(res).to.have.status(200);
        done();
      });
    });

    it('does the body contain the bookshelfs', (done) => {
      request.get(requestData, (err, res, body) => {
        if (err) return done(err);
        expect(body).to.have.property('bookshelfs');
        done();
      });
    });

    it('does the body contain the list of bookshelfs', (done) => {
      request.get(requestData, (err, res, body) => {
        if (err) return done(err);
        expect(body).to.have.property('bookshelfs').to.be.an('array');
        done();
      });
    });
  });

  describe('Tests PUT /api/v1/bookshelfs/:id', () => {
    let stubBookshelf;
    const putData = {
      url: `${serverBaseUrl}/bookshelfs/670a46ccd9341f13294c2da5`,
      json: {
        name: 'My Virtual Bookshelf new name',
      },
    };

    beforeEach(() => {
      stubBookshelf = sinon.stub(BookshelfController, 'modifyBookshelf')
        .callsFake((req, res) => {
          res.set('Content-Type', 'application/json');
          res.status(200).send({
            id: '670a46ccd9341f13294c2da5',
            name: 'My Virtual Bookshelf new name',
            ownerId: 'poiuyt-098765-4321',
            dateCreated: 'Thursday 10, October, 2024',
            dateModified: `${(new Date).toUTCString()}`,
            retrieveAllBookshelfs: 'http://127.0.0.1/api/v1/bookshelfs',
            removeBookshelf: 'http://127.0.0.1/api/v1/bookshelfs/<:id>',
          });
        });
    });

    afterEach(() => {
      stubBookshelf.restore();
    });

    it('is the endpoints reachable', (done) => {
      request.put(putData, (err, res, body) => {
        if (err) return done(err);
        expect(res).to.have.status(200);
        done()
      });
    });

    it('does it have a correct content-type', (done) => {
      request.put(putData, (err, res, body) => {
        if (err) return done(err);
        expect(res.headers['content-type']).to.contain('application/json');
        done();
      });
    });

    it('does the new name reflect', (done) => {
      request.put(putData, (err, res, body) => {
        if (err) return done(err);
        expect(body).to.have.property('name', 'My Virtual Bookshelf new name');
        done();
      });
    });
  });

  describe('Tests DELETE /api/v1/bookshelfs/:id', () => {
    let stubBookshelf;
    const deleteData = {
      url: `${serverBaseUrl}/bookshelfs/670a46ccd9341f13294c2da5`,
      json: {}
    };

    beforeEach(() => {
      stubBookshelf = sinon.stub(BookshelfController, 'deleteBookshelf')
        .callsFake((req, res) => {
          res.set('Content-Type', 'application/json');
          res.status(204).send({});
        });
    });

    afterEach(() => {
      stubBookshelf.restore();
    });

    it('is the endpoint reachable', (done) => {
      request.delete(deleteData, (err, res, body) => {
        if (err) return done(err);
        expect(res).to.have.status(204);
        done();
      });
    });

  });

});
