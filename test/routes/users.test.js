const chai = require('chai');
const request = require('request');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const UserController = require('../../controllers/UserController');
const app = require('../../server');

chai.use(chaiHttp);
const { expect } = chai;
const serverBaseUrl = 'http://127.0.0.1:5000/api/v1';

describe('User Authentication Endpoints Testing', () => {
  describe('Tests User Registration Endpoint', () => {
    let stub;
    let postData;
    before(() => {
      postData = {
        url: `${serverBaseUrl}/user/register`,
        form: {
          name: 'Azeez Adebayo',
          email: 'azeez@gmail.com',
          password: 'DocMong%4$%123',
        },
      };
    });

    beforeEach(() => {
      stub = sinon.stub(UserController, 'registerUser')
        .callsFake((req, res) => {
          res.set('Content-Type', 'application/json');
          res.status(201).send({
            message: 'user created successfully',
            dateCreated: new Date().toUTCString(),
            loginEndpoint: 'http://127.0.0.1:5000/api/v1/user/login',
          });
        });

    });

    afterEach(() => {
      stub.restore();
    });

    it('is the endpoint reachable', (done) => {
      request.post(postData, (err, res, bod) => {
        if (err) return done(err);
        expect(res).to.have.status(201);
        done();
      })
    });

    it('does the endpoint respond with the right content', (done) => {
      request.post(postData, (err, res, body) => {
        if (err) return done(err);
        expect(res.headers['content-type']).to.include('application/json');
        done();
      })
    });

    it('is the process of the endpoint successful', (done) => {
      request.post(postData, (err, res, body) => {
        if (err) return done(err);
        const responseBody = JSON.parse(body);  // because body is string
        expect(responseBody).to.include({ message: 'user created successfully' });
        done();
      });
    });
  });

  describe('Tests User\'s Login Endpoint', () => {
    let stub;
    let postData;
    before(() => {
      postData = {
        url: `${serverBaseUrl}/user/login`,
        form: {
          email: 'azeez@gmail.com',
          password: 'DocMong%4$%123',
        },
      };
    });

    beforeEach(() => {
      stub = sinon.stub(UserController, 'login')
        .callsFake((req, res) => {
          res.set('Content-Type', 'application/json');
          res.status(200).send({
            message: 'user created successfully',
            dateCreated: new Date().toUTCString(),
            loginEndpoint: 'http://127.0.0.1:5000/api/v1/user/login',
          });
        });

    });

    afterEach(() => {
      stub.restore();
    });

  });
});
