const { expect } = require('chai');
const request = require('request');
const { stub } = require('sinon');
const UserAuthentication = require('../../controllers/UserAuthentication');

const serverUrl = 'http://127.0.0.1:5000/api/v1/user/register';

describe('User Authentication Endpoints Testing', () => {
  describe('Tests User Registration Endpoint', () => {
    beforeEach(() => {
      stub(UserAuthentication, 'registerUser').returns({
        message: 'user created successfully',
        dateCreated: new Date().toUTCString(),
        loginEndpoint: 'http://127.0.0.1:5000/api/v1/user/login',
      });
      // #TODO: stub the midleware also here.....
    });

    it('is the endpoint reachable', (done) => {
      request.get(serverUrl, (err, res, body) => {
        if (err) return done(err);
        expect(res.statusCode === 200).to.be.true;
        done();
      })
    });

    it('does the endpoint respond with the right content', (done) => {
      if (err) return done(err);
      expect(res.headers['content-type']).to.include('application/json');
      done();
    });

    it('is the process of the endpoint successful', (done) => {
      request.get(serverUrl, (err, res, body) => {
        if (err) return done(err);
        expect(body).to.include('message: user created successfully');
        done();
      });
    });

    afterEach(() => {
      UserAuthentication.registerUser.restore();
    });
  });
});
