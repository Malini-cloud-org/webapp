import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Sequelize connection
export const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT,
});

//Service to check database connection for healthcheck
export const checkDatabaseConnection = async()=>{

  try{
    // Using sequelize's authenticate method to check the connection
    await sequelize.authenticate();
    console.log('Database connected successfully');
  }
  catch(error){
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};