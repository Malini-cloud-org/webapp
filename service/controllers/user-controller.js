import * as UserService from '../services/user-service.js';
import * as responseHandler from './response-handler.js';
import moment from 'moment';
import logger from '../lib/logger.js';
import statsd  from '../lib/statsd.js';
//Helper function to set no cache headers for response
const setNoCacheHeaders = (res) => {
    res.header('Cache-Control', 'no-store');
  };

const isValidEmail = (email) => {
    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

// Controller for creating new user
export const createUserController = async(req, res)=>{

    const startTime = Date.now();
    statsd.increment('api.post.user.calls');

    try{

        logger.info("POST request for user:");
        
        const {email, password, firstName, lastName } = req.body;

        //Ensure that all the required fields are provided
        if(!email || !password || !firstName || !lastName){
            setNoCacheHeaders(res);
            logger.error('Missing required fields for user creation');
            return responseHandler.setError(new Error('All fields (email, password, firstName, lastName) are required.'), res, 400);
           
          }

          if(req.body.account_created || req.body.account_updated || req.body.uuid){
            setNoCacheHeaders(res);
            logger.error('Invalid fields in the user creation request, cannot update dates');
            return responseHandler.setError(new Error('Enter value for only valid fields'), res, 400);
        }
    
        // Validate email format
        if (!isValidEmail(email)) {
            setNoCacheHeaders(res);
            logger.error('Invalid email format: ' + email); 
            return responseHandler.setError(new Error('Invalid email format'), res, 400); }

        //Check if email already exists
        const emailExists = await UserService.checkEmailExists(email);
        if(emailExists){
            setNoCacheHeaders(res);
            logger.error('User with this email already exists: ' + email);
            return responseHandler.setError(new Error('User with this email already exists.'), res, 400);
            
        }

    
    //Create user
    const newUser = await UserService.createUser(req.body);
    setNoCacheHeaders(res);
    logger.info('User created successfully: ' + JSON.stringify(newUser));
    res.setHeader('Content-Type', 'application/json');
    return responseHandler.setResponse(res, 201, newUser);

} catch(error){

    logger.error("Error creating user: " + error.message);
    return responseHandler.setError(new Error('Error while creating user'), res, 400);
}

finally {
    const duration = Date.now() - startTime; // Calculate duration
    statsd.timing('api.post.user.response_time', duration); // Log API call duration
}
};

//Controller for fetching user information of authenticated user

// Get self user controller
export const getSelfUserController = async (req, res) => {
    const startTime = Date.now();
    statsd.increment('api.get.user.calls');

    try{
        logger.info("GET request for user:");
        setNoCacheHeaders(res);
        res.setHeader('Content-Type', 'application/json');

        const email = req.user.email;
        if (req.headers['content-type'] || Object.keys(req.query).length > 0) {
            logger.error('Payload not allowed in request');
            return responseHandler.setError(new Error("Payload not allowed"),res,400);
          }
        
        const user = await UserService.getUserByEmail(email);
        if(user){
            logger.info('User retrieved successfully: ' + JSON.stringify(user));
            return responseHandler.setResponse(res,200,user);
        }else{
            logger.error('User not found: ' + email);
            return responseHandler.setError(new Error("User not found"), res, 404);
        }
    }
    catch(error){

        logger.error("Error fetching user: ", error);
        return responseHandler.setError(new Error('Error while fetching user'), res, 500);
    }
    finally {
        const duration = Date.now() - startTime; // Calculate duration
        statsd.timing('api.get.user.response_time', duration); // Log API call duration
    }
};

//Controller for updating information of authenticated user
export const updateSelfUserController = async(req,res) =>{

    const startTime = Date.now();
    statsd.increment('api.put.user.calls'); 
    logger.info("PUT request for user:");

    const email = req.user.email; // Get authenticated user's email
    setNoCacheHeaders(res);

    //Valid fields for update
    const validFields = ['firstName', 'lastName', 'password', 'email'];

    if(Object.keys(req.body).length === 0){
        logger.error('Request body is empty for update.');
        return responseHandler.setError(new Error('Request body is empty. Please provide fields to update.'), res, 400);
    }


    // Check if any fields in the request body are invalid
    const invalidFields = Object.keys(req.body).some(field => !validFields.includes(field));
    if (invalidFields) {
        logger.error('Invalid fields in payload for update.');
        return responseHandler.setError(new Error('Invalid fields in payload. Only firstName, lastName, and password can be updated.'), res, 400);
    }

    // Check if any of the required fields is missing
    const missingFields = validFields.some(field => !Object.keys(req.body).includes(field));
        if (missingFields) {
            logger.error('Missing required fields for update.');
            return responseHandler.setError(
                new Error('All fields (firstName, lastName, password, email) are required. Please provide complete data.'),res,400);
        }

    // Check if email in the request body is different from the logged-in user's email
    if (req.body.email && req.body.email !== email) {
        logger.error('Attempt to change email address by user: ' + email);
        return responseHandler.setError(new Error('Cannot change email address. Please use your registered email.'), res, 400);
    }

    try{

        const user = await UserService.getUserByEmailForUpdate(email);
        if(!user){
            logger.error('User not found for update: ' + email);
            return responseHandler.setError(new Error('User not found'), res, 404);

        }

        // Update user data with allowed fields from the request
        user.set({ ...req.body, account_updated: new Date() });

        //Saving updated user information
        await user.save();
        
        user.account_updated = moment(user.account_updated).subtract(4, 'hours').format('MMMM Do YYYY, h:mm:ss a');
        logger.info('User updated successfully: ' + email);
        return responseHandler.setResponse(res, 204);

    } catch(error){

        logger.error("Error updating user:", error.message);
        return responseHandler.setError(new Error('Error updating user data'),res , 500);
    }
    finally {
        const duration = Date.now() - startTime; // Calculate duration
        statsd.timing('api.put.user.response_time', duration); // Log API call duration
    }
}
