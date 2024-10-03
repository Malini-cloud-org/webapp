import User from '../models/User.js';
import moment from 'moment';

// Function to format user dates
const formatDates = (user) => {
    if (user) {
        user.account_created = moment(user.account_created).format('MMMM Do YYYY, h:mm:ss a');
        user.account_updated = moment(user.account_updated).format('MMMM Do YYYY, h:mm:ss a');
    }
    return user;
};

//Check if email/username already exists in the database
export const checkEmailExists =  async (email) =>{
    try {
        const user = await User.findOne({where : {email}});
    
        return user!==null;
      } catch (error) {

        console.error('Error occurred while fetching user:', error);
        return false; 
      }

}

//Service to fetch data of existing authenticated user
export const getUserByEmail = async(email)=>{
    try{
        const user = await User.findOne({
            where: {
                email,
            },
            attributes: {
                exclude: ['password'],
            },
        });

        return formatDates(user ? user.toJSON() : null);   
    } catch(error){
        console.error('Error occurred while fetching user:', error);
    }
}

// To get email for update opeartion
export const getUserByEmailForUpdate = async (email) => {
    try {
        const user = await User.findOne({
            where: { email },
            attributes: { exclude: ['password'] },
        });
        return user; // Sequelize instance
    } catch (error) {
        console.error('Error occurred while fetching user for update:', error);
        throw new Error('Error fetching user for update');
    }
};
//Service to create new user
export const createUser = async(payload) => {
    try{

        // Creating new user instance
        const newUser = await User.create(payload, {
            attributes: ['UUID', 'Email', 'firstName', 'lastName', 'account_created', 'account_updated'],
        });

        const userResponse = newUser.toJSON();
        delete userResponse.password;

        return formatDates(userResponse);
    } catch(error){

        console.error('Error occured while creating user', error);
    }
}