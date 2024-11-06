import dotenv from 'dotenv';
import { expect } from 'chai';
import supertest from 'supertest';
import initialize from '.././app.js';
import { Buffer } from 'buffer';
import express from 'express';

import { syncModels } from '../models/index.js';

dotenv.config();
let request;
const createTestApp = async() => {
    const app = express(); // Create a new Express application instance
    app.use(express.json()); // Use JSON middleware
    initialize(app); // Initialize routes with the app instance

    try {
        await syncModels(true); // Force sync models before tests
        console.log('Test database synced successfully.');
    } catch (error) {
        console.error('Failed to sync test database:', error);
        process.exit(1); // Exit on failure to prevent false positives
    }
    return app; // Return the app instance
};

before(async () => {
  const app = await createTestApp(); // Await the async function
  request = supertest(app); // Pass the resolved app to supertest
});

function encodeBasicAuth(email, password) {
    return 'Basic ' + Buffer.from(`${email}:${password}`).toString('base64');
}

describe('User Endpoint Integration Tests', () => {
    const testUsername = 'integrationtest.user@example.com';
    const testPassword = 'testPassword';
    const newTestPassword = 'qwertyiou';
  
  
    it('Test 1 - Create an account and get it', async () => {
      try {
        const authHeader = encodeBasicAuth(testUsername, testPassword);
  
        // Create the account
        const createResponse = await request.post('/v1/user').send({
          firstName: 'Testing',
          lastName: 'User',
          email: testUsername,
          password: testPassword,
        });
  
        expect(createResponse.statusCode).to.equal(201); // Expecting 201 Created
  
        // Retrieve the created account
        const getResponse = await request.get('/v1/user/self').set('Authorization', authHeader);
        const responseBody = JSON.parse(getResponse.text);
  
        console.log(responseBody);
  
        expect(getResponse.statusCode).to.equal(200); // Expecting 200 OK
        expect(responseBody.email).to.equal(testUsername);
        expect(responseBody.firstName).to.equal('Testing');
        expect(responseBody.lastName).to.equal('User');
      } catch (error) {
        console.error('Test 1 failed:', error.message);
        process.exit(1);
      }
    });


    it('Test 2 - Update the account and get it', async () => {
        try {
          const authHeader = encodeBasicAuth(testUsername, testPassword);
          const updatePayload = {
            firstName: 'Jannie',
            lastName: 'Doey',
            password: newTestPassword,
            email:    testUsername
          };
    
          // Update the account
          const updateResponse = await request.put('/v1/user/self')
            .send(updatePayload)
            .set('Authorization', authHeader);
    
          expect(updateResponse.statusCode).to.satisfy((code) => code >= 200 && code < 300, 'Update failed');
    
          // Retrieve the updated account
          const newAuthHeader = encodeBasicAuth(testUsername, newTestPassword);
          const getResponse = await request.get('/v1/user/self').set('Authorization', newAuthHeader);
    
          expect(getResponse.statusCode).to.equal(200); // Expecting 200 OK
          const responseBody = JSON.parse(getResponse.text);
    
          console.log(responseBody);
          expect(responseBody.email).to.equal(testUsername);
          expect(responseBody.firstName).to.equal('Jannie');
          expect(responseBody.lastName).to.equal('Doey');
         
        } catch (error) {
          console.error('Test 2 failed:', error.message);
          process.exit(1);
        }
      });
    



});