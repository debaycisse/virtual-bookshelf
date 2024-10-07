const { expect } = require('chai');
const request = require('request');

const serverUrl = 'http://127.0.0.1:5000/api/v1/status';

describe('Virtual Bookshelf Endpoint Server Testing', () => {
  it('should confirm that the server is available', (done) => {
    request.get(serverUrl, (err, res, body) => {
      if (err) return done(err);
      expect(body).to.include("server is available");
      done();
    });    
  });

  it('should confirm that the server has HTTP status 200', (done) => {
    request.get(serverUrl, (err, res, body) => {
      if (err) return done(err);
      expect(res.statusCode === 200).to.be.true;
      done();
    });
  });

  it('should confirm that returned content is JSON', (done) => {
    request.get(serverUrl, (err, res, body) => {
      if (err) return done(err);
      expect(res.headers['content-type']).to.include('application/json');
      done();
    });
  });
});
