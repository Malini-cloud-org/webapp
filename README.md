# webapp - Health Check and User API

## Overview

This project implements a RESTful API for a cloud-native web application, focusing on health checks and user management. The API monitors the health of the application instance by checking the database connection and ensuring that the application is running smoothly. Additionally, it provides endpoints for user account creation, updating user information, and retrieving user details.
Also implements github workflow for running application tests.

## Prerequisites

- **Server Operating System**: Ubuntu 24.04 LTS
- **Runtime Environment**: Node.js for JavaScript
- **Relational Database**: PostgreSQL
- **Backend Framework**: Express.js
- **ORM Framework**: Sequelize
- **API Testing Tool**: Postman or Bruno (for testing API endpoints)
- **Node.js** and **npm** installed on local machine.

## Environment Setup

1. Clone the repository:

   git clone `git@github.com:Malini-cloud-org/webapp.git`

   cd webapp/service

2. Install dependencies

    `npm install`

3. Create a .env file in the service directory and add the following variables:

  ```plaintext
    DB_USERNAME=database_username
    DB_PASSWORD=database_password
    DB_NAME=database_name
    DB_HOST=database_host
    DB_DIALECT=postgres
    PORT=port_number

    

4. For build and deployment to start the application, use the following command from within the service directory:

    `npm run dev`

5. Once the application is running, the endpoints can be using an API testing tool like Postman or Bruno

   1. Test the Healthcheck API : 
         - Endpoint: GET `http://localhost:3000/healthz`
         - This will return the health status of the application instance and its connection to the database.
  
   2. Test the User API:
         - Endpoint: POST `http://localhost:3000/v1/user`
         - Creates a new user account.

         - Endpoint: GET `http://localhost:3000/v1/user/self`
         - Retrieves the authenticated user’s account information.

         - Endpoint: PUT `http://localhost:3000/v1/user/self`
         - Updates the authenticated user’s account information.

## API Endpoints

### Health Check Endpoint

- **Endpoint**: `/healthz`
- **Method**: `GET`
- **Description**:
  - Checks the health of the application by verifying the postgres database connection.
- **Response**:
  - **HTTP 200 OK**: If the application is succefully connected to the database.
  - **HTTP 503 Service Unavailable**: If the application is unable to connect to the database.
  - **HTTP 400 Bad Request**: If the request includes any payload.
  - **HTTP 405 Method Not Allowed**: If any method other than GET is used.

### User Endpoints

#### Create a New User

- **Endpoint**: `v1/user`
- **Method**: `POST`
- **Description**: Creates a new user account.
- **Request Body**:
  - `email` (string, required)
  - `password` (string, required)
  - `first_name` (string, required)
  - `last_name` (string, required)
- **Response**:
  - **HTTP 201 Created**: If the user is successfully created.
  - **HTTP 400 Bad Request**: If the email already exists or if any required field is missing.
- **Notes**:
  - `account_created` is set to the current time upon successful creation.
  - `account_updated` is also set to the current time upon successful creation.
  - Passwords are stored securely using the BCrypt hashing scheme with salt.

#### Update User Information

- **Endpoint**: `v1/user/self`
- **Method**: `PUT`
- **Description**: Updates the authenticated user’s account information.
- **Request Body**:
  - `first_name` (string, optional)
  - `last_name` (string, optional)
  - `password` (string, optional)
- **Response**:
  - **HTTP 204 NO content**: If the user information is successfully updated.
  - **HTTP 400 Bad Request**: If attempting to update any field other than `first_name`, `last_name`, or `password`.
- **Notes**:
  - `account_updated` is set to the current time upon successful update.
  - A user can only update their own account information.

#### Get User Information

- **Endpoint**: `v1/user/self`
- **Method**: `GET`
- **Description**: Retrieves the authenticated user’s account information.
- **Response**:
  - **HTTP 200 OK**: If the user information is successfully retrieved.
  - **Response Payload**: Returns all fields for the user except for the password.

Testing pull request merge in the readme file
