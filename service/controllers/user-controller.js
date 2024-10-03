import * as UserService from '../services/user-service.js';
import * as responseHandler from './response-handler.js';
import moment from 'moment';
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

    try{
        const {email, password, firstName, lastName } = req.body;

        //Ensure that all the required fields are provided
        if(!email || !password || !firstName || !lastName){
            setNoCacheHeaders(res);
            return responseHandler.setError(new Error('All fields (email, password, firstName, lastName) are required.'), res, 400);
           
          }

          if(req.body.account_created || req.body.account_updated || req.body.uuid){
            setNoCacheHeaders(res);
            return responseHandler.setError(new Error('Enter value for only valid fields'), res, 400);
        }
    
        // Validate email format
        if (!isValidEmail(email)) {
            setNoCacheHeaders(res);
            return responseHandler.setError(new Error('Invalid email format'), res, 400); }

        //Check if email already exists
        const emailExists = await UserService.checkEmailExists(email);
        if(emailExists){
            setNoCacheHeaders(res);
            return responseHandler.setError(new Error('User with this email already exists.'), res, 400);
            
        }

    
    //Create user
    const newUser = await UserService.createUser(req.body);
    setNoCacheHeaders(res);
    
    res.setHeader('Content-Type', 'application/json');
    return responseHandler.setResponse(res, 201, newUser);

} catch(error){

    console.error("Error creating user: ", error);
    return responseHandler.setError(new Error('Error while creating user'), res, 400);
}
};

//Controller for fetching user information of authenticated user

// Get self user controller
export const getSelfUserController = async (req, res) => {

    try{
        setNoCacheHeaders(res);

        const email = req.user.email;
        if (req.headers['content-type'] || Object.keys(req.query).length > 0) {
            return responseHandler.setError(new Error("Payload not allowed"),res,400);
          }
        
        const user = await UserService.getUserByEmail(email);
        if(user){
            return responseHandler.setResponse(res,200,user);
        }else{

            return responseHandler.setError(new Error("User not found"), res, 404);
        }
    }
    catch(error){

        console.error("Error fetching user: ", error);
        return responseHandler.setError(new Error('Error while fetching user'), res, 500);
    }
};

//Controller for updating information of authenticated user
export const updateSelfUserController = async(req,res) =>{

    const email = req.user.email; // Get authenticated user's email
    setNoCacheHeaders(res);

    //Valid fields for update
    const validFields = ['firstName', 'lastName', 'password', 'email'];

    if(Object.keys(req.body).length === 0){
        return responseHandler.setError(new Error('Request body is empty. Please provide fields to update.'), res, 400);
    }


    // Check if any fields in the request body are invalid
    const invalidFields = Object.keys(req.body).some(field => !validFields.includes(field));
    if (invalidFields) {
        return responseHandler.setError(new Error('Invalid fields in payload. Only firstName, lastName, and password can be updated.'), res, 400);
    }

    // Check if email in the request body is different from the logged-in user's email
    if (req.body.email && req.body.email !== email) {
            return responseHandler.setError(new Error('Cannot change email address. Please use your registered email.'), res, 400);
    }

    try{

        const user = await UserService.getUserByEmailForUpdate(email);
        if(!user){

            return responseHandler.setError(new Error('User not found'), res, 404);

        }

        // Update user data with allowed fields from the request
        user.set({ ...req.body, account_updated: new Date() });

        //Saving updated user information
        await user.save();
        
        user.account_updated = moment(user.account_updated).format('MMMM Do YYYY, h:mm:ss a');
        return responseHandler.setResponse(res, 204);

    } catch(error){

        console.error("Error updating user:", error);
        return responseHandler.setError(new Error('Error updating user data'),res , 500);
    }
}
