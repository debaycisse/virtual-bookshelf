const chai = require('chai');
const chaiHttp = require('chai-http');
const request = require('request');
const sinon = require('sinon');
const Utils = require('../../utils/Utils');
const CategoryController = require('../../controllers/CategoryController');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Book Category Controller Endpoints Testing', () => {

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

  describe('Tests POST /api/v1/category', () => {
    let stubCategory;
    const categoryPostData = {
      url: `${serverBaseUrl}/category`,
      json: {
        name: 'Science category',
        parentId: '670ba90f0fd871b721d2b1f6',
      },
    };
    const noNamePostData = {
      url: `${serverBaseUrl}/category`,
      json: {
        parentId: '670ba90f0fd871b721d2b1f6',
      },
    };
    const noParentIdPostData = {
      url: `${serverBaseUrl}/category`,
      json: {
        name: 'Science category',
      },
    };
    const emptyBodyPostData = {
      url: `${serverBaseUrl}/category`,
    };

    beforeEach(() => {
      stubCategory = sinon.stub(CategoryController, 'createCategory')
        .callsFake((req, res) => {
          res.set('Content-Type', 'application/json');

          if (Object.keys(req.body).length < 1) {
            res.status(400).send({
              error: 'Required parameters must be provided',
            });
            return;
          }

          if (!req.body.name) {
            res.status(400).send({
              error: 'Name can not be missing',
            });
            return;
          }

          if (!req.body.parentId) {
            res.status(400).send({
              error: 'Parent ID can not be missing',
            });
            return;
          }

          res.status(201).send({
            acknowledged: true,
            id: '975ed90f0fd873a321d2bf3ed',
            name: req.body.name,
            parentId: req.body.parentId,
            nBooks: 0,
            message: 'craeted category successfully',
            dateCreated: 'Sun, 13 Oct 2024 11:03:43 GMT',
            dateModified: 'Sun, 13 Oct 2024 11:03:43 GMT',
            retrieveAllCategories: 'http://127.0.0.1:5000/api/v1/categories',
	          retrieveCategory: 'http://127.0.0.1:5000/api/v1/category/<:id>',
          });
        });
    });

    afterEach(() => {
      stubCategory.restore();
    });

    it('is the endpoint reachable', (done) => {
      request.post(categoryPostData, (err, res, body) => {
        if (err) return done(err);
        expect(res).to.have.status(201);
        done();
      })
    });

    it('is the content\'s type correct ', (done) => {
      request.post(categoryPostData, (err, res, body) => {
        if (err) return done(err);
        expect(res.headers['content-type']).to.contain('application/json');
        done();
      });
    });

    it('does it return 404 for missing name', (done) => {
      request.post(noNamePostData, (err, res, body) => {
        if (err) return done(err);
        expect(res).to.have.status(400);
        done();
      });
    });

    it('is error returned for absence of parent ID', (done) => {
      request.post(noParentIdPostData, (err, res, body) => {
        if (err) return done(err);
        expect(body).to.have.property('error', 'Parent ID can not be missing');
        done();
      });
    });

    it('is empty request body returned with error', (done) => {
      request.post(emptyBodyPostData, (err, res, body) => {
        if (err) return done(err);
        expect(body).to.deep.includes('Required parameters must be provided');
        done();
      });
    });
  });

  describe('Tests GET /api/v1/category/<id>', () => {
    let stubCategory;
    const categoryGetData = {
      url: `${serverBaseUrl}/category/670cd6957d3afeb10458f6a7`,
      json: {
        parentId: '670cd6657d3afeb10458f6a6',
      },  
    };
    const categoryGetDataNoParentId = {
      url: `${serverBaseUrl}/category/670cd6957d3afeb10458f6a7`,
      json: {}
    };

    beforeEach(() => {
      stubCategory = sinon.stub(CategoryController, 'getCategory')
        .callsFake((req, res) => {
          res.set('Content-Type', 'application/json');

          if (!req.params.id) {
            return res.status(400).send({
              error: 'Invalid category\'s id',
            });
          }

          if (!req.body.parentId) {
            return res.status(400).send({
              error: 'No parent\'s id',
            });
          }

          res.status(200).send({
            id: '670cd6957d3afeb10458f6a7',
            name: 'Science',
            parentId: 'poiuyt-098765-4321',
            nBooks: 0,
            dateCreated: 'Thursday 10, October, 2024',
            dateModified: 'Thursday 10, October, 2024', 
            retrieveAllCategories: 'http://127.0.0.1:5000/api/v1/categories',
            retrieveCategory: 'http://127.0.0.1:5000/api/v1/category/<:id>',
          });
        });
    });

    afterEach(() => {
      stubCategory.restore();
    });

    it('is the endpoint reachable', (done) => {
      request(categoryGetData, (err, res, body) => {
        if (err) return done(err);
        expect(res).to.have.status(200);
        done();
      });
    });

    it('does it discover a missing parent ID in a request', (done) => {
      request(categoryGetDataNoParentId, (err, res, body) => {
        if (err) return done(err);
        expect(body).to.have.property('error', 'No parent\'s id');
        done();
      });
    });
  });

  describe('Tests GET /api/v1/categories', () => {
    let stubCategories;
    const categoriesGetData = {
      url: `${serverBaseUrl}/categories`,
      json: {
        parentId: '670cd6657d3afeb10458f6a6',
      },
    };
    const categoriesGetDataNoParentId = {
      url: `${serverBaseUrl}/categories`,
      json: {}
    };

    beforeEach(() => {
      stubCategories = sinon.stub(CategoryController, 'getCategories')
        .callsFake((req, res) => {
          res.set('Content-Type', 'application/json');

          if (!req.body.parentId) {
            return res.status(400).send({
              error: 'No parent\'s id',
            });
          }

          res.status(200).send({
            categories: [
              {
                id: '670cd6957d3afeb10458f6a7',
                name: 'Science',
                parentId: 'poiuyt-098765-4321',
                nBooks: 0,
                dateCreated: 'Thursday 10, October, 2024',
                dateModified: 'Thursday 10, October, 2024', 
              },
              {
                id: '985de6959e2afeb10395f6a7',
                name: 'Technology',
                parentId: 'poiuyt-098765-4321',
                nBooks: 12,
                dateCreated: 'Thursday 10, October, 2024',
                dateModified: 'Thursday 10, October, 2024', 
              }
            ],
            currentPage: 1,
            previousPage:null,
            nextPage: null,
            retrieveAllCategories: 'http://127.0.0.1:5000/api/v1/categories',
            retrieveCategory: 'http://127.0.0.1:5000/api/v1/category/<:id>',
          });
        });
    });

    afterEach(() => {
      stubCategories.restore();
    });

    it('is the endpoint reachable', (done) => {
      request.get(categoriesGetData, (err, res, body) => {
        if (err) return done(err);
        expect(res).to.have.status(200);
        done();
      });
    });

    it('is parent ID present', (done) => {
      request.get(categoriesGetData, (err, res, body) => {
        if (err) return done(err);
        expect(body).to.have.property('currentPage', 1);
        done();
      });
    });

    it('does the returned body contain correct data', (done) => {
      request.get(categoriesGetData, (err, res, body) => {
        if (err) return done(err);
        expect(body.categories).to.be.an('array');
        done();
      });
    });

    it('does process handle missing parent id', (done) => {
      request.get(categoriesGetDataNoParentId, (err, res, body) => {
        if (err) return done(err);
        expect(body).to.have.property('error', 'No parent\'s id');
        done();
      });
    });
  });

  describe('Tests PUT /api/v1/category/<id>', () => {
    let stubCategory;
    const categoryPutData = {
      url: `${serverBaseUrl}/category/670cd6957d3afeb10458f6a7`,
      json: {
        parentId: '670cd6657d3afeb10458f6a6',
      },  
    };
    const categoryPutDataNoParentId = {
      url: `${serverBaseUrl}/category/670cd6957d3afeb10458f6a7`,
      json: {}
    };

    beforeEach(() => {
      stubCategory = sinon.stub(CategoryController, 'modifyCategory')
        .callsFake((req, res) => {
          res.set('Content-Type', 'application/json');

          if (!req.params.id) {
            return res.status(400).send({
              error: 'Invalid category\'s id',
            });
          }

          if (!req.body.parentId) {
            return res.status(400).send({
              error: 'No parent\'s id',
            });
          }

          res.status(200).send({
            id: '670cd6957d3afeb10458f6a7',
            name: 'Science',
            parentId: 'poiuyt-098765-4321',
            nBooks: 0,
            message: 'updated category successfully',
            dateCreated: 'Thursday 10, October, 2024',
            dateModified: 'Thursday 10, October, 2024', 
            retrieveCategory: 'http://127.0.0.1:5000/api/v1/category/<:id>',
            removeCategory: 'http://127.0.0.1:5000/api/v1/category/<:id>',
          });
        });
    });

    afterEach(() => {
      stubCategory.restore();
    });

    it('is the endpoint reachable', (done) => {
      request.put(categoryPutData, (err, res, body) => {
        if (err) return done(err);
        expect(res).to.have.status(200);
        done();
      });
    });

    it('is it able to update category document', (done) => {
      request.put(categoryPutData, (err, res, body) => {
        if (err) return done(err);
        expect(body).to.have.property('message', 'updated category successfully');
        done();
      });
    });

    it('does it return error for missing parent ID', (done) => {
      request.put(categoryPutDataNoParentId, (err, res, body) => {
        if (err) return done(err);
        expect(body).to.have.property('error', 'No parent\'s id');
        done();
      });
    });
  });

  describe('Tests DELETE /api/v1/category/<id>', () => {
    let stubCategory;
    const categoryPutData = {
      url: `${serverBaseUrl}/category/670cd6957d3afeb10458f6a7`,
      json: {
        parentId: '670cd6657d3afeb10458f6a6',
      },  
    };
    const categoryPutDataNoParentId = {
      url: `${serverBaseUrl}/category/670cd6957d3afeb10458f6a7`,
      json: {}
    };

    beforeEach(() => {
      stubCategory = sinon.stub(CategoryController, 'deleteCategory')
        .callsFake((req, res) => {
          res.set('Content-Type', 'application/json');

          if (!req.params.id) {
            return res.status(400).send({
              error: 'Invalid category\'s id',
            });
          }

          if (!req.body.parentId) {
            return res.status(400).send({
              error: 'No parent\'s id',
            });
          }

          return res.status(204).send({});
        });
    });

    afterEach(() => {
      stubCategory.restore();
    });

    it('is the endpoint reachable', (done) => {
      request.delete(categoryPutData, (err, res, body) => {
        if (err) return done(err);
        expect(res).to.have.status(204);
        done();
      });
    });

    it('is the process successfully handled', (done) => {
      request.delete(categoryPutData, (err, res, body) => {
        if (err) return done(err);
        expect(body).to.be.an('undefined');
        done();
      });
    });

    it('is the endpoint able to handle missing parent ID gracefully', (done) => {
      request.delete(categoryPutDataNoParentId, (err, res, body) => {
        if (err) return done(err);
        expect(body).have.property('error', 'No parent\'s id');
        done();
      });
    });
  });

});
