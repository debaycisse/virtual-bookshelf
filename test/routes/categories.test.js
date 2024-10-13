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

});
