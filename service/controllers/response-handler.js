export const setResponse = (response, statusCode, data = null)=>{
    response.header('Cache-Control',  'no-cache,no-store, must-revalidate');
    if (data) {
        // If there's data, returning it as JSON
        // logger.info(`Response sent with status ${statusCode} and data: ${JSON.stringify(data)}`);
        response.status(statusCode).json(data);
      } else {
        // If no data , send only the status code
        // logger.info(`Response sent with status ${statusCode}`);
        response.status(statusCode).send();
      }
    
};

export const setError = (error, response,status = 500) =>{
  // logger.error('Error occurred: ' + error.message); 
  response.header('Cache-Control', 'no-cache,no-store, must-revalidate');
  response.status(status).send(); // Error response

};