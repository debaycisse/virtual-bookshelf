const chai = require('chai');
const request = require('request');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const ShelveController = require('../../controllers/ShelveController');

chai.use(chaiHttp);
const { expect } = chai;
const serverBaseUrl = 'http://127.0.0.1:5000/api/v1';

describe('Shelve Controller Endpoints Testing', () => {
  describe('Tests Shelve\'s Creation Endpoint', () => {
    let stubShelveCreation;
    let postData;
    before(() => {
      postData = {
        url: `${serverBaseUrl}/shelve`,
        form: {
          name: 'My First Shelve',
        },
      };
    });

    beforeEach(() => {
      stubShelveCreation = sinon.stub(ShelveController, 'createShelve')
        .callsFake((req, res) => {
          res.set('Content-Type', 'application/json');
          res.status(201).send({
            acknowledgement: true,
            id: 'qwerty-1234567890',
            parentId: 'poiuyt-098765-4321',
            message: 'shelve created successfully',
            dateCreated: new Date().toUTCString(),
            retrieveShelveEndpoint: 'http://127.0.0.1:5000/api/v1/shelve',
          });
        });
    });

    afterEach(() => {
      stubShelveCreation.restore();
    });

    it('is the endpoint reachable', (done) => {
      request.post(postData, (err, res, body) => {
        if (err) return done(err);
        expect(res).to.have.status(201);
        done();
      })
    });

    it('does the endpoint respond with correct content', (done) => {
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
        expect(responseBody).to.include({ message: 'shelve created successfully' });
        expect(responseBody).to.have.property('ownerId', 'poiuyt-098765-4321');
        done();
      });
    });
  });

});
