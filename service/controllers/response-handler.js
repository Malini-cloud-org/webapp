export const setResponse = (response)=>{
    response.header('Cache-Control',  'no-cache,no-store, must-revalidate');
    response.status(200).send();
};

export const setError = (error, response,status = 500) =>{
    console.error( error);
    response.header('Cache-Control', 'no-cache,no-store, must-revalidate');
    response.status(status).send(); // Error response

};