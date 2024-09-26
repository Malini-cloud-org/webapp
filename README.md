# webapp - Health Check 

## Overview

This project implements a health check RESTful API for a cloud-native web application. The API monitors the health of the application instance, checking the database connection and ensuring that the application is running smoothly. It follows cloud-native application requirements and RESTful API standards.

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

   git clone `git@github.com:Malini240/webapp.git`
   cd webapp/service

2. Install dependencies

    `npm install`

3. Create a .env file in the service directory and add the following variables:

    DB_USERNAME=database_username
    DB_PASSWORD=database_password
    DB_NAME=database_name
    DB_HOST=database_host
    DB_DIALECT=postgres
    PORT=port_number

4. For build and deployemnt to start the application, use the following command from within the service directory:

    `npm run dev`

5. Test the API : Once the application is running, the health check endpoint can be using an API testing tool like Postman or Bruno

   - Endpoint: GET `http://localhost:3000/healthz`
   - This will return the health status of the application instance and its connection to the database.

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

