//Implementing user model

import  {Sequelize, DataTypes } from 'sequelize';
import  bcrypt from 'bcrypt';
import  {sequelize}  from '../services/health-service.js';


const User = sequelize.define('User',{
        //Defining attributes for user model
        uuid :{
            type: DataTypes.UUID,
            defaultValue : DataTypes.UUIDV4,
            readOnly : true,
            primaryKey: true
        },

        email:{
            type : DataTypes.STRING,
            unique: true,
            allowNull: false,
            // lowercase: true,
            validate: {
                isEmail :true,
            },
        },
        
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },

        firstName: {
            type: DataTypes.STRING,
            allowNull : false,          
        },

        lastName: {
            type: DataTypes.STRING,
            allowNull : false,          
        },

        verification_token: {
            type: DataTypes.STRING, // Store the verification token here
            allowNull: true
        },
        token_expiration: {
            type: DataTypes.DATE, // Store the token expiration time here
            allowNull: true
        },
        verification_link: {  // New column for the verification link
            type: DataTypes.STRING,
            allowNull: true,
        },
        is_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,  // By default, the user is not verified
        }
     
    },{
        //Customizing names of createdAt and updatedAt fields
        createdAt: 'account_created',
        updatedAt: 'account_updated',
    });

    // Hooks for password hashing
    User.beforeCreate(async (user) => {
        if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
      });
      
    User.beforeUpdate(async (user) => {
        if (user.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
      });

      User.prototype.validatePassword = async function(password) {
        return await bcrypt.compare(password, this.password);
      };
      

 export default User;
     
