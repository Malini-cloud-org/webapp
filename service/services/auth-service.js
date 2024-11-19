import User from '../models/User.js';
import bcrypt from 'bcrypt';
import * as responseHandler from '../controllers/response-handler.js';
import logger from '../lib/logger.js';
import statsd  from '../lib/statsd.js';

//Middleware for authentication
const userAuth = async (req, res, next) =>{
    try{
        const authHeader = req.get('Authorization');

        //Checking if Authorization header is present
        if(!authHeader){
            logger.error('Authorization header is missing');
            return responseHandler.setError(new Error('Not authenticated'), res, 401);

        }
        // Split the Authorization header into type and token
        const [authType, authToken] = authHeader.split(' ');
           
        if (authType !== 'Basic' || !authToken) {
            logger.error('Invalid authorization format');
            return responseHandler.setError(new Error('Invalid authorization format'), res, 401);
        }

        //Decoding credentials from the authorization header
        const credentials = Buffer.from(authHeader.split(' ')[1], 'base64')
        .toString()
        .split(':');

        const email = credentials[0];
        const password = credentials[1];

         // Validate that both email and password are present
        if (!email || !password) {
            logger.error('Email and password are required for authentication'); 
            return responseHandler.setError(new Error('Email and password are required for authentication'), res, 400);
        }
        const startTime = Date.now();
        //Finding user by email/username
        const user = await User.findOne({where : {email}});
        statsd.timing('db.user_auth.query_time', Date.now() - startTime);

        if(!user){
            logger.error("Username doesn't exist: " + email);
            return responseHandler.setError(new Error("Username doesn't exist"), res, 400);

        }
       
        //Compare entered password with hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            logger.error('Wrong username or password for user: ' + email);
            return responseHandler.setError(new Error('Wrong username or password!'), res, 401);
        }

         // Check if user is verified
         if (process.env.NODE_ENV !== 'test') {
         if (!user.is_verified) {
            logger.error('User is not verified: ' + email);
            return responseHandler.setError(new Error("User is not verified. Please verify your email."), res, 403);
        }
         }
        //Successful authentication
        req.user= user;
        logger.info('User authenticated successfully: ' + email);
        next();

    }catch(error){
        console.error("Authentication failed! ", error);
        return responseHandler.setError(new Error('Error during authentication'), res, 500);
    }
};

export default userAuth;