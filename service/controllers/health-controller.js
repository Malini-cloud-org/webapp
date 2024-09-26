import * as healthService from '../services/health-service.js'; // Import the health check service
import * as responseHandler from './response-handler.js';

export const checkDatabaseConnection = async(req, res)=>{

  // Checking if the request method is GET
  if (req.method !== 'GET') {
      return responseHandler.setError(new Error('Method Not Allowed'),res, 405); // Return 405 Method Not Allowed
  }

   // Checking for query parameters
  if (Object.keys(req.query).length > 0) {
        return responseHandler.setError(new Error('Request parameters not allowed'), res, 400); // Return 400 Bad Request
  }

  // Checking for payload in the request body
  if (Object.keys(req.body).length > 0) {
      return responseHandler.setError(new Error('Payload not allowed'),res, 400); // Return  400 Bad Request 
  }

  try{
    await healthService.checkDatabaseConnection();
    responseHandler.setResponse(res);//HTTP 200 OK
  } 
  catch(error){
    console.error('Database connection error:', error);
    responseHandler.setError(error,res,503); // HTTP 503 Unavailable
  }

};