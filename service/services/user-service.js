import User from '../models/User.js';
import moment from 'moment';
import logger from '../lib/logger.js';
import statsd  from '../lib/statsd.js';

// Function to format user dates
const formatDates = (user) => {
    if (user) {
        user.account_created = moment(user.account_created).subtract(4, 'hours');
        user.account_updated = moment(user.account_updated).subtract(4, 'hours');
    }
    return user;
};

//Check if email/username already exists in the database
export const checkEmailExists =  async (email) =>{
    const startTime = Date.now();
    try {
        const user = await User.findOne({where : {email}});
        statsd.timing('db.check_email.query_time', Date.now() - startTime);
        logger.info('Email check for existence: ' + email);
        return user!==null;
      } catch (error) {

        console.error('Error occurred while fetching user:', error);
        return false; 
      }
      finally {
        const duration = Date.now() - startTime;
        statsd.timing('db.check_email.query_time', duration);
    }

}

//Service to fetch data of existing authenticated user
export const getUserByEmail = async(email)=>{
    const startTime = Date.now();
    try{
        const user = await User.findOne({
            where: {
                email,
            },
            attributes: {
                exclude: ['password'],
            },
        });
        statsd.timing('db.get_user.query_time', Date.now() - startTime);
        logger.info('User fetched by email: ' + email);
        return formatDates(user ? user.toJSON() : null);   
    } catch(error){
        console.error('Error occurred while fetching user:', error);
    }
    finally {
        const duration = Date.now() - startTime;
        statsd.timing('db.get_user_by_email.query_time', duration);
    }
}

// To get email for update opeartion
export const getUserByEmailForUpdate = async (email) => {
    const startTime = Date.now();
    try {
        const user = await User.findOne({
            where: { email },
            attributes: { exclude: ['password'] },
        });
        statsd.timing('db.get_user_for_update.query_time', Date.now() - startTime);
        logger.info('User fetched for update: ' + email);
        return user; // Sequelize instance
    } catch (error) {
        console.error('Error occurred while fetching user for update:', error.message);
        throw new Error('Error fetching user for update');
    }
    finally {
        const duration = Date.now() - startTime;
        statsd.timing('db.get_user_for_update.query_time', duration);
    }
};
//Service to create new user
export const createUser = async(payload) => {
    const startTime = Date.now();
    try{

        // Creating new user instance
        const newUser = await User.create(payload, {
            attributes: ['UUID', 'Email', 'firstName', 'lastName', 'account_created', 'account_updated'],
        });
        statsd.timing('db.create_user.query_time', Date.now() - startTime);
        const userResponse = newUser.toJSON();
        delete userResponse.password;

        logger.info('User created successfully: ' + JSON.stringify(userResponse));

        //return userResponse;
        return formatDates(userResponse);
    } catch(error){

        logger.error('Error occured while creating user', error.message);
    }
    finally {
        const duration = Date.now() - startTime;
        statsd.timing('db.create_user.query_time', duration);
    }
}