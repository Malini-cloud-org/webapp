import dotenv from 'dotenv';
import { expect } from 'chai';
import supertest from 'supertest';
import initialize from '.././app.js';
import { Buffer } from 'buffer';
import express from 'express';
import User from '../models/User.js';

import  {sequelize, checkDatabaseConnection}  from '../services/health-service.js';


dotenv.config();

const createTestApp = () => {
    const app = express(); // Create a new Express application instance
    app.use(express.json()); // Use JSON middleware
    initialize(app); // Initialize routes with the app instance
    return app; // Return the app instance
};

const request = supertest(createTestApp()); 

function encodeBasicAuth(email, password) {
    return 'Basic ' + Buffer.from(`${email}:${password}`).toString('base64');
}

describe('User Endpoint Unit Tests', () => {

    before(async () => {
        await checkDatabaseConnection();
      });
     
      after(async () => {
        await User.destroy({ where: {} });
        await sequelize.close();
      });

    const testEmail = `testuser54321@example.com`;
    const testPassword = 'testpassword';
    const newTestPassword = 'qwertyiou';

    it('Unit Test 1 - Create a user account', async () => {
      const createResponse = await request.post('/v1/user').send({
        firstName: 'Testing',
        lastName: 'User',
        email: testEmail,
        password: testPassword,
      });
  
      expect(createResponse.statusCode).to.equal(201); // Expecting successful creation

    });

    it('Unit Test 2 - Missing required fields - 400', async () => {
        const createResponse = await request.post('/v1/user').send({
            firstName: 'Testing',
            lastName: 'User',
            // email is missing
            password: testPassword,
        });

        expect(createResponse.statusCode).to.equal(400); // Expecting a Bad Request
    });

    it('Unit Test 3 - Invalid email format - 400', async () => {
        const createResponse = await request.post('/v1/user').send({
            firstName: 'Testing',
            lastName: 'User',
            email: 'invalid-email', // Invalid email format
            password: testPassword,
        });

        expect(createResponse.statusCode).to.equal(400); // Expecting a Bad Request
    });

    it('Unit Test 4 - Email already exists - 400', async () => {
        // Create a user to ensure the email exists
        await request.post('/v1/user').send({
            firstName: 'Existing',
            lastName: 'User',
            email: testEmail, // Use the same email as before
            password: testPassword,
        });

        const createResponse = await request.post('/v1/user').send({
            firstName: 'Duplicate',
            lastName: 'User',
            email: testEmail, // Same email
            password: testPassword,
        });

        expect(createResponse.statusCode).to.equal(400); // Expecting a Bad Request
});

it('Unit Test 5 - Using other methods (GET) - 405', async () => {
    const getResponse = await request.get('/v1/user'); // Using GET method
    expect(getResponse.statusCode).to.equal(405); // Expecting Method Not Allowed
});

it('Unit Test 6 - Contains Query parameters - 400', async () => {
    const createResponse = await request.post('/v1/user?someParam=value').send({
        firstName: 'Testing',
        lastName: 'User',
        email: testEmail,
        password: testPassword,
    });

    expect(createResponse.statusCode).to.equal(400); // Expecting a Bad Request
});

it('Unit Test 7 - Empty body - 400', async () => {
    const createResponse = await request.post('/v1/user').send({}); // Sending empty body

    expect(createResponse.statusCode).to.equal(400); // Expecting a Bad Request
});

//GET endpoint tests

it('Unit Test 8 - Successful retrieval of user data - 200', async () => {
    const response = await request
        .get('/v1/user/self')
        .set('Authorization', encodeBasicAuth(testEmail, testPassword)); // Set basic auth header

    expect(response.statusCode).to.equal(200); // Expecting successful retrieval
    expect(response.body.email).to.equal(testEmail); // Verify retrieved email
});

it('Unit Test 9 - Invalid payload (unwanted headers or query) - 400', async () => {
    const response = await request
        .get('/v1/user/self?extraParam=value') // Adding an unwanted query parameter
        .set('Authorization', encodeBasicAuth(testEmail, testPassword));

    expect(response.statusCode).to.equal(400); // Expecting a Bad Request
});

it('Unit Test 10 - Empty username and password - 400', async () => {
    const response = await request
        .get('/v1/user/self')
        .set('Authorization', encodeBasicAuth('', '')); // Empty username and password

    expect(response.statusCode).to.equal(400); // Expecting a Bad Request
});

it('Unit Test 11 - Invalid password - 401', async () => {
    const response = await request
        .get('/v1/user/self')
        .set('Authorization', encodeBasicAuth(testEmail, 'wrongPassword')); // Invalid password

    expect(response.statusCode).to.equal(401); // Expecting Unauthorized
});

it('Unit Test 12 - Bad email format - 400', async () => {
    const response = await request
        .get('/v1/user/self')
        .set('Authorization', encodeBasicAuth('invalid-email', testPassword)); // Bad email format

    expect(response.statusCode).to.equal(400); // Expecting a Bad Request
});

it('Unit Test 13 - Missing Authorization header - 401', async () => {
    const response = await request.get('/v1/user/self'); // No Authorization header
    expect(response.statusCode).to.equal(401); // Expecting Unauthorized
});

// Test cases for bad methods
it('Unit Test 14 - PATCH method not allowed - 405', async () => {
    const response = await request.patch('/v1/user/self').set('Authorization', encodeBasicAuth(testEmail, testPassword));
    expect(response.statusCode).to.equal(405); // Expecting Method Not Allowed
});

it('Unit Test 15 - HEAD method not allowed - 405', async () => {
    const response = await request.head('/v1/user/self').set('Authorization', encodeBasicAuth(testEmail, testPassword));
    expect(response.statusCode).to.equal(405); // Expecting Method Not Allowed
});

it('Unit Test 16 - OPTIONS method not allowed - 405', async () => {
    const response = await request.options('/v1/user/self').set('Authorization', encodeBasicAuth(testEmail, testPassword));
    expect(response.statusCode).to.equal(405); // Expecting Method Not Allowed
});

//PUT TESTS
it('Unit Test 17 - Empty request body - 400', async () => {
    const response = await request
        .put('/v1/user/self')
        .set('Authorization', encodeBasicAuth(testEmail, testPassword))
        .send({}); // Empty body

    expect(response.statusCode).to.equal(400); // Expecting Bad Request
});

it('Unit Test 18 - Invalid fields in body - 400', async () => {
    const response = await request
        .put('/v1/user/self')
        .set('Authorization', encodeBasicAuth(testEmail, testPassword))
        .send({ firstName: 'NewFirstName',  lastName: 'NewLastName', 
            email: testEmail, // Valid email
            password: 'newpassword',  invalidField: 'InvalidValue',  }); // Invalid field

    expect(response.statusCode).to.equal(400); // Invalid fields in body
});

it('Unit Test 19 - Attempt to change email - 400', async () => {
    const response = await request
        .put('/v1/user/self')
        .set('Authorization', encodeBasicAuth(testEmail, testPassword))
        .send({ email: 'new-email@example.com' , // Attempt to change email
            firstName: 'UpdatedFirstName', 
            lastName: 'UpdatedLastName', 
            password: testPassword  }); 

    expect(response.statusCode).to.equal(400); // Expecting Bad Request
});

it('Unit Test 20 - Attempting to update account_updated - 400', async () => {
    const response = await request
        .put('/v1/user/self')
        .set('Authorization', encodeBasicAuth(testEmail, testPassword))
        .send({ firstName: 'UpdatedFirstName', 
            lastName: 'UpdatedLastName', 
            email: testEmail, // Keeping the same email
            password: newTestPassword, // Valid password
            account_updated: new Date() // Attempting to update account_updated field
        });

    expect(response.statusCode).to.equal(400); // Expecting Bad Request
});

it('Unit Test 21 - Successful user update - 204', async () => {
    const response = await request
        .put('/v1/user/self')
        .set('Authorization', encodeBasicAuth(testEmail, testPassword))
        .send({ firstName: 'UpdatedFirstName', lastName: 'UpdatedLastName' , email :testEmail, password :newTestPassword}); // Successful update

    expect(response.statusCode).to.equal(204); // Expecting No Content
});

after(() => {
    process.exit(0);
  });





































});