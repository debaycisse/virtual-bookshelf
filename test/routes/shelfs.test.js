const chai = require('chai');
const request = require('request');
const sinon = require('sinon');
const ShelveController = require('../../controllers/ShelveController');

describe('Shelve Controller Endpoints Testing', () => {
  describe('Tests Shelve\'s Creation Endpoint', () => {
    let stubShelve;
    let shelvePostData;
    const serverBaseUrl = 'http://127.0.0.1:5000/api/v1';

    before(() => {
      shelvePostData = {
        url: `${serverBaseUrl}/shelve`,
        form: {
          name: 'My Virtual Shelf'
        },
      };
    });

    beforeEach(() => {
      stubShelve = sinon.stub(ShelveController, 'createShelve')
        .callsFake((req, res) => {
          res.set('Content-Type', 'application/json');
          res.status(201).send({
            acknowledge: true,
            id: 'qwerty-123-456-7890' ,
            ownerId: 'poiuyt-098765-4321',
            message: 'created shelve successfully',
            dateCreated: 'Thursday 10, October, 2024',
            retrieveShelvesEndpoint: 'http://127.0.0.1/api/v1/shelves',
            retrieveShelveEndpoint: 'http://127.0.0.1/api/v1/shelve/<:id>',
          });
        });
    });

    afterEach(() => {
      stubShelve.restore();
    });

    it('should confirm that the server is available', (done) => {
      request.post(serverUrl, shelvePostData, (err, res, body) => {
        if (err) return done(err);
        expect(res).to.have.status(200);
        done();
      });    
    });

  });

});
