// models/Image.js
import  {Sequelize, DataTypes } from 'sequelize';
import  {sequelize}  from '../services/health-service.js';
import User from './User.js';

const Image = sequelize.define('Image', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
        readOnly: true, 
    },
    file_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false,
        readOnly: true, 
    },
    upload_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
        readOnly: true, 
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
            model: 'Users', 
            key: 'uuid',
        },
        onDelete: 'CASCADE',
        readOnly: true, 
    },
}, {
    timestamps: false,
});

export default Image;