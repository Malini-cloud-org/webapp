import * as healthService from '../services/health-service.js'; // Import the health check service
import * as responseHandler from './response-handler.js';
import logger from '../lib/logger.js';
import statsd  from '../lib/statsd.js';

export const checkDatabaseConnection = async(req, res)=>{

  const startTime = Date.now();
  statsd.increment('api.health.check.calls');

  // Checking if the request method is GET
  if (req.method !== 'GET') {
      logger.error('Method not allowed: ' + req.method);
      return responseHandler.setError(new Error('Method Not Allowed'),res, 405); // Return 405 Method Not Allowed
  }

   // Checking for query parameters
  if (Object.keys(req.query).length > 0) {
        logger.error('Request parameters not allowed: ' + JSON.stringify(req.query));
        return responseHandler.setError(new Error('Request parameters not allowed'), res, 400); // Return 400 Bad Request
  }

  const contentType = req.headers['content-type'];
  if (contentType) {
    // Handle content type check
    logger.error('Payload not allowed: ' + contentType);
    return responseHandler.setError(new Error('Payload not allowed'), res, 400);
    next();
}

  // Checking for payload in the request body
  if (req.body && Object.keys(req.body).length > 0) {
    logger.error('Payload not allowed in the request body');
    return responseHandler.setError(new Error('Payload not allowed'),res, 400); // Return  400 Bad Request 
  }


  try{

    await healthService.checkDatabaseConnection();
    logger.info('Database connection successful');
    responseHandler.setResponse(res,200);//HTTP 200 OK
  } 
  catch(error){
    logger.error('Database connection error:', error);
    responseHandler.setError(error,res,503); // HTTP 503 Unavailable
  }
  finally {
    const duration = Date.now() - startTime; // Calculate duration
    statsd.timing('api.health.check.response_time', duration); // Log API call duration
}

};