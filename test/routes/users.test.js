const chai = require('chai');
const request = require('request');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const UserController = require('../../controllers/UserController');
const app = require('../../server');

chai.use(chaiHttp);
const { expect } = chai;
const serverBaseUrl = 'http://127.0.0.1:5000/api/v1';

describe('User Controller Endpoints Testing', () => {
  describe('Tests User\'s Registration Endpoint', () => {
    let stubUserRegister;
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
      stubUserRegister = sinon.stub(UserController, 'registerUser')
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
      stubUserRegister.restore();
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
    let stubUserLogin;
    let loginData;
    before(() => {
      loginData = {
        url: `${serverBaseUrl}/user/login`,
        form: {
          email: 'azeez@gmail.com',
          password: 'DocMong%4$%123',
        },
      };
    });

    beforeEach(() => {
      stubUserLogin = sinon.stub(UserController, 'login')
        .callsFake((req, res) => {
          res.set('Content-Type', 'application/json');
          res.status(200).send({
              message: 'login was successful',
              token: 'ur748848tg-488ffjh-4747hfrhf-5tgggfg',
              logoutEndpoint: 'logout endpoint url',
          });
        });

    });

    afterEach(() => {
      stubUserLogin.restore();
    });

    it('is the endpoint reachable', (done) => {
      request.post(loginData, (err, res, bod) => {
        if (err) return done(err);
        expect(res).to.have.status(200);
        done();
      });
    });

    it('does the endpoint respond with the right content', (done) => {
      request.post(loginData, (err, res, body) => {
        if (err) return done(err);
        expect(res.headers['content-type']).to.include('application/json');
        done();
      })
    });

    it('is the process of the endpoint successful', (done) => {
      request.post(loginData, (err, res, body) => {
        if (err) return done(err);
        const responseBody = JSON.parse(body);
        expect(responseBody).to.include({ message: 'login was successful' });
        done();
      });
    });
  });

  describe('Tests User\'s Logout Endpoint', () => {
    let stubUserLogout;
    let loginData;
    before(() => {
      loginData = {
        url: `${serverBaseUrl}/user/logout`,
      };
    });

    beforeEach(() => {
      stubUserLogout = sinon.stub(UserController, 'logout')
        .callsFake((req, res) => {
          res.set('Content-Type', 'application/json');
          res.status(200).send({ message: 'logged out successfully' });
        });

    });

    afterEach(() => {
      stubUserLogout.restore();
    });

    it('is the endpoint reachable', (done) => {
      request.post(loginData, (err, res, bod) => {
        if (err) return done(err);
        expect(res).to.have.status(200);
        done();
      });
    });

    it('does the endpoint respond with the right content', (done) => {
      request.post(loginData, (err, res, body) => {
        if (err) return done(err);
        expect(res.headers['content-type']).to.include('application/json');
        done();
      })
    });

    it('is the process of the endpoint successful', (done) => {
      request.post(loginData, (err, res, body) => {
        if (err) return done(err);
        const responseBody = JSON.parse(body);
        expect(responseBody).to.include({ message: 'logged out successfully' });
        done();
      });
    });
  });

  describe('Tests User\'s Profile Endpoint', () => {
    let stubUserProfile;
    const serverUrl = `${serverBaseUrl}/user/me`
    beforeEach(() => {
      stubUserProfile = sinon.stub(UserController, 'profile')
        .callsFake((req, res) => {
          req.set('X-Token', 'd8ac284d-e4af-46a4-a021-b9fc84c393e3');
          res.set('Content-Type', 'application/json');
          res.status(200).send({
            name: 'Azeez Adebayo',
            books: 6,
            categories: 4,
            shelves: 1,
            registrationDate: 'Wed, 09 Oct 2024 04:54:53 GMT',
          });
        });
    });

    afterEach(() => {
      stubUserProfile.restore();
    })

    it('is the endpoint reachable', (done) => {
      request.get(serverUrl, (err, res, body) => {
        if (err) return done(err);
        expect(res).to.have.status(200);
        done();
      });
    });

    it('does the endpoint respond with the right content', (done) => {
      request.get(serverUrl, (err, res, body) => {
        if (err) return done(err);
        expect(res.headers['content-type']).to.include('application/json');
        done();
      })
    });

    it('does the endpoint contain expected body\'s contents', (done) => {
      request.get(serverUrl, (err, res, body) => {
        if (err) return done(err);
        const responseBody = JSON.parse(body);
        expect(responseBody).to.include({ name: 'Azeez Adebayo' });
        expect(responseBody).to.have.property('books', 6);
        expect(responseBody).to.have.property('categories', 4);
        expect(responseBody).to.have.property('categories', 4);
        expect(responseBody).to.have.property('registrationDate', 'Wed, 09 Oct 2024 04:54:53 GMT');
        done();
      });
    });
  });
});
