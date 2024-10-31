import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import User from './User.js';
import Image from './Image.js';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

//To load environment variables
dotenv.config();

export const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT,
});

//One to one relationship
User.hasOne(Image, { foreignKey: 'user_id' });
Image.belongsTo(User, { foreignKey: 'user_id' });

// // Sync models in the correct order
// async function syncModels() {
//   await User.sync(); // Create User table first
//   await Image.sync(); // Create Image table with foreign key to User
// }

// syncModels()
//   .then(() => console.log('Tables synced successfully.'))
//   .catch((error) => console.error('Error syncing tables:', error));

sequelize.sync()
    .then(() => {
        console.log('All tables created successfully.');
    })
    .catch((error) => {
        console.error('Error creating tables:', error);
    });