import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import logger from '../lib/logger.js';
import statsd  from '../lib/statsd.js';

dotenv.config();

// Initialize the Sequelize connection
export const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT,
});

//Service to check database connection for healthcheck
export const checkDatabaseConnection = async()=>{
  const startTime = Date.now();

  try{
    // Using sequelize's authenticate method to check the connection
    await sequelize.authenticate();
    statsd.timing('db.health_check.query_time', Date.now() - startTime); 
    logger.info('Database connected successfully'); 
  }
  catch(error){
    logger.error('Unable to connect to the database: ' + error.message);
    throw error;
  }
  finally {
    const duration = Date.now() - startTime;
    statsd.timing('db.health_check.query_time', duration);
  }
};