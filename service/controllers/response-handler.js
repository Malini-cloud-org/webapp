export const setResponse = (response, statusCode, data = null)=>{
    response.header('Cache-Control',  'no-cache,no-store, must-revalidate');
    if (data) {
        // If there's data, returning it as JSON
        response.status(statusCode).json(data);
      } else {
        // If no data , send only the status code
        response.status(statusCode).send();
      }
    
};

export const setError = (error, response,status = 500) =>{
  console.error( error);
  response.header('Cache-Control', 'no-cache,no-store, must-revalidate');
   // response.status(status).send(); // Error response
  // response.sendStatus(status);
  response.status(status).end();

};