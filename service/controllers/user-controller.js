import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as UserService from '../services/user-service.js';
import * as responseHandler from './response-handler.js';
import moment from 'moment';
import logger from '../lib/logger.js';
import statsd  from '../lib/statsd.js';
import User from '../models/User.js';

// Initialize SNS client
const sns = new AWS.SNS();
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

            // Generate a verification token for the user
            const token = uuidv4(); 

            // Set the token expiration time (2 minutes from now)
            const expirationTime = new Date(newUser.account_created);
            expirationTime.setMinutes(expirationTime.getMinutes() +2);
            
            const verificationLink = `${process.env.BASE_URL}/v1/user/verify?email=${newUser.email}&token=${token}`;
            // Save token, verification link and expiration time in the database
            newUser.verification_link = verificationLink;
            newUser.verification_token = token;
            newUser.token_expiration = expirationTime;
            await newUser.save();

            if (process.env.NODE_ENV !== 'test') {
            // Publish a message to the SNS topic
            const snsMessage = {
                first_name: newUser.firstName,
                last_name: newUser.lastName,
                email: newUser.email,
                verification_link: verificationLink,
                expiry_time: expirationTime.toISOString()
            };
            console.log("SNS_TOPIC_ARN:", process.env.SNS_TOPIC_ARN);
            // console.log("Verification link:", verificationLink);
    
            logger.info('Preparing to publish to SNS Topic: ' + process.env.SNS_TOPIC_ARN);

            // Publish to SNS 
            const snsParams = {
                Message: JSON.stringify(snsMessage),
                TopicArn: process.env.SNS_TOPIC_ARN,  // Use your SNS Topic ARN from environment variables
            };
            
            logger.info('Publishing message to SNS with the following parameters: ', snsParams);
            try {
                await sns.publish(snsParams).promise();
                logger.info('SNS message published successfully.');
            } catch (snsError) {
                logger.error('Error publishing SNS message:', snsError);
            }
      
            logger.info('SNS message published successfully.');
           }   // Send the response excluding the password
            const userResponse = { ...newUser.toJSON() }; 
            delete userResponse.password; 
            delete userResponse.verification_token;
            delete userResponse.token_expiration;
            delete userResponse.is_verified;
            delete userResponse.verification_link;
    
    
            res.setHeader('Content-Type', 'application/json');
            return responseHandler.setResponse(res, 201, userResponse);

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
        const userResponse = { ...user }; 
        delete userResponse.verification_token;
        delete userResponse.token_expiration;
        delete userResponse.is_verified;
        delete userResponse.verification_link;
        if(user){
            logger.info('User retrieved successfully: ' + userResponse);
            return responseHandler.setResponse(res,200,userResponse);
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

// Controller to verify user via token
export const verifyUserController = async (req, res) => {
    const { email, token } = req.query;  // Extract email and token from query string

      // Checking for payload in the request body
    if (req.body && Object.keys(req.body).length > 0) {
        logger.error('Payload not allowed in the request body');
        return responseHandler.setError(new Error('Payload not allowed'),res, 400); // Return  400 Bad Request 
    }

    statsd.increment('api.verify_user.calls');

    if (!email || !token) {
        logger.error("Missing email or token in the verification request.");
        return responseHandler.setError(new Error("Email and token are required for verification."), res, 400);
    }

    try {
        // Find the user by email
        const user = await UserService.getUserByEmail(email);
        console.log(user);

        if (!user) {
            logger.error(`User not found with email: ${email}`);
            statsd.increment('api.verify_user.errors');
            return responseHandler.setError(new Error("User not found."), res, 404);
        }

        // Check if the user is already verified
         if (user.is_verified) {
             logger.error(`User already verified: ${email}`);
            statsd.increment('api.verify_user.success'); // Increment counter for error (already verified)
            return responseHandler.setResponse(res, 200, { message: "User is already verified." });        }

        // Check if the token matches and if it is expired
        if (user.verification_token !== token) {
            console.log(user.verification_token);
            console.log(token);
            logger.error(`Invalid token for user: ${email}`);
            logger.info(user.verification_token);
            logger.info(token);
            statsd.increment('api.verify_user.errors');
            return responseHandler.setError(new Error("Invalid token."), res, 400);
        }

        // Check if the token has expired
        const currentTime = new Date();
        if (currentTime > new Date(user.token_expiration)) {
            logger.error(`Token expired for user: ${email}`);
            statsd.increment('api.verify_user.errors');
            return responseHandler.setError(new Error("Token has expired."), res, 400);
        }

        // Update the user directly in the database
        await User.update(
            {
                is_verified: true,
                verification_token: null,
                token_expiration: null,
                verification_link: null,
            },
            { where: { email } }
        );

        // Respond with a success message
        logger.info(`User verified successfully: ${email}`);
        statsd.increment('api.verify_user.success');
        if (req.headers.accept && req.headers.accept.includes('text/html')) {
            // Serve an HTML response
            return res.status(200).send(`
                <html>
                    <head><title>Verification Successful</title></head>
                    <body>
                        <h1>Verification Successful</h1>
                        <p>Your account has been verified successfully. You can now log in.</p>
                    </body>
                </html>
            `);
        } else {
            // Serve a JSON response (for Postman or other API clients)
            return responseHandler.setResponse(res, 200, { message: "User verified successfully." });
        }

    } catch (error) {
        logger.error("Error verifying user: ", error);
        statsd.increment('api.verify_user.errors'); 
        return responseHandler.setError(new Error('Error verifying user'), res, 500);
    }
};

