import User from '../models/User.js';
import bcrypt from 'bcrypt';
import * as responseHandler from '../controllers/response-handler.js';


//Middleware for authentication
const userAuth = async (req, res, next) =>{
    try{
        const authHeader = req.get('Authorization');

        //Checking if Authorization header is present
        if(!authHeader){
            return responseHandler.setError(new Error('Not authenticated'), res, 401);

        }
        // Split the Authorization header into type and token
        const [authType, authToken] = authHeader.split(' ');
           
        if (authType !== 'Basic' || !authToken) {
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
                    return responseHandler.setError(new Error('Email and password are required for authentication'), res, 400);
        }
        
        //Finding user by email/username
        const user = await User.findOne({where : {email}});

        if(!user){
            return responseHandler.setError(new Error("Username doesn't exist"), res, 400);

        }
       
        //Compare entered password with hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return responseHandler.setError(new Error('Wrong username or password!'), res, 401);
        }

        //Successful authentication
        req.user= user;
        next();

    }catch(error){
        console.error("Authentication failed! ", error);
        return responseHandler.setError(new Error('Error during authentication'), res, 500);
    }
};

export default userAuth;