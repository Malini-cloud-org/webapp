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

  const contentType = req.headers['content-type'];
  if (contentType) {
    // Handle content type check
        return responseHandler.setError(new Error('Payload not allowed'), res, 400);
    next();
}

  // Checking for payload in the request body
  if (req.body && Object.keys(req.body).length > 0) {
      return responseHandler.setError(new Error('Payload not allowed'),res, 400); // Return  400 Bad Request 
  }


  try{
    await healthService.checkDatabaseConnection();
    responseHandler.setResponse(res,200);//HTTP 200 OK
  } 
  catch(error){
    console.error('Database connection error:', error);
    responseHandler.setError(error,res,503); // HTTP 503 Unavailable
  }

};