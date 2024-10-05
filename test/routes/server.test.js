import { expect } from 'chai';
import request from 'supertest';
import app from '../server';

const serverUrl = 'http://127.0.0.1:5000';

describe('Virtual Bookshelf Endpoint Server Testing', () => {

  it('should confirm that the server is available', async () => {
    const response = await request(app)
      .get(serverUrl)
      .send();

    expect(response.body).to.include({ status: 'available' });
  });

  it('should confirm that the server has HTTP status 200', async () => {
    const response = await request(app)
      .get(serverUrl)
      .send();

    expect(response.status).to.equal(200);
  });

  it('should confirm that returned content is JSON', async () => {
    const response = await request(app)
      .get(serverUrl)
      .send();

    expect(response.header('content-type')).to.includes('application/json');
  });
});