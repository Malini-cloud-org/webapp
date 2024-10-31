import * as imageService from '../services/image-service.js';
import * as responseHandler from './response-handler.js';
import moment from 'moment';
import Image from '../models/Image.js';
import User from '../models/User.js';
import logger from '../lib/logger.js';
import statsd  from '../lib/statsd.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('image');

export const uploadUserProfileImage = async (req, res) => {
    
    const startTime = Date.now();
    statsd.increment('api.post.user.profileImage.calls');
    upload(req, res, async (err) => {
        if (err) {
            logger.error('File upload error:', err);
            return responseHandler.setError(new Error("File upload error"), res, 400);
        }

    try {
       
        
        // Retrieve user's email from req.user (set by authentication middleware)
        const email = req.user.email;
        logger.info(`User with email ${email} is attempting to upload a profile image.`);

        // Fetch user ID (UUID) from the database using email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            logger.error(`User not found with email ${email}.`);
            return responseHandler.setError(new Error("User not found"), res, 404);

        }
        
        const userId = user.uuid;

        // Check if the user already has a profile image
        const existingImage = await Image.findOne({ where: { user_id: userId } });
        if (existingImage) {
            logger.error(`User ID ${userId} already has a profile image. Upload denied.`);
            return responseHandler.setError(new Error("User already has a profile image. Please delete the existing image first."), res, 400);
        }

         // Validate file presence
        if (!req.file) {
            logger.error(`User ID ${userId} did not provide an image file in the upload request.`);
            return responseHandler.setError(new Error("No image file provided."), res, 400);
         }

        // Validate file type
        const validFileTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (!validFileTypes.includes(req.file.mimetype)) {
            logger.warn(`User ID ${userId} uploaded an invalid file type: ${mimetype}.`);
            return responseHandler.setError(new Error( "Invalid file type. Only JPEG and PNG files are allowed."), res, 400);

        }

        // Pass only file and userId to the service
        const newImage = await imageService.uploadImageService(req.file, userId);

        const response = {
            file_name: newImage.file_name,
            id: newImage.id,
            url: newImage.url,
            upload_date: new Date(newImage.upload_date).toISOString().split('T')[0],
            user_id: newImage.user_id,
        };

        logger.info(`Profile image upload successful for User ID ${userId}. Image details: ${JSON.stringify(response)}`);
        return responseHandler.setResponse( res, 201, response);

    } catch (error) {
        logger.error(`Error uploading profile image: ${error.message}`);
        return responseHandler.setError(new Error( "Invalid file type. Only JPEG and PNG files are allowed."), res, 500);

    }
    finally {
        const duration = Date.now() - startTime;
        statsd.timing('api.post.user.profileImage.response_time', duration);
    }
});
};


export const getUserProfileImage = async (req, res) => {
    const startTime = Date.now();
    statsd.increment('api.get.user.profileImage.calls');

    try {
        logger.info("GET request for user's profile image.");
        
        // Ensure no body or query parameters are passed
        if (req.headers['content-type'] || Object.keys(req.query).length > 0) {
            logger.error('Payload or query parameters not allowed in the request.');
            return responseHandler.setError(new Error("Payload not allowed"), res, 400);
        }

        // Retrieve user's email from authenticated request
        const email = req.user.email;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            logger.error(`User not found with email: ${email}`);
            return responseHandler.setError(new Error("User not found"), res, 404);
        }

        // Find the user's image
        const userId = user.uuid;
        const image = await imageService.getImageService(user.uuid);

        // Extract file name and extension
        const [baseName, extension] = image.file_name.match(/^(.*?)(\.[^.]*$|$)/).slice(1);
        const shortenedBaseName = baseName.length > 8 ? `${baseName.slice(0, 8)}...` : baseName;
        const shortenedFileName = `${shortenedBaseName}${extension}`;

        if (!image) {
            logger.error(`No profile image found for user ID: ${userId}`);
            return responseHandler.setError(new Error("Profile image not found"), res, 404);
        }

        // Response payload
        const response = {
            file_name: shortenedFileName,
            id: image.id,
            url: image.url,
            upload_date: new Date(image.upload_date).toISOString().split('T')[0],
            user_id: image.user_id,
        };

        logger.info(`Profile image retrieved successfully for User ID: ${userId}`);
        return responseHandler.setResponse(res, 200, response);

    } catch (error) {
        logger.error(`Error retrieving profile image: ${error.message}`);
        return responseHandler.setError(new Error('Error while fetching profile image'), res, 500);
    } finally {
        const duration = Date.now() - startTime;
        statsd.timing('api.get.user.profileImage.response_time', duration);
    }
};

export const deleteUserProfileImage = async (req, res) => {
    const startTime = Date.now();
    statsd.increment('api.delete.user.profileImage.calls');

    try {
        logger.info("DELETE request for user's profile image.");

        // Ensure no payload or query params
        if (req.headers['content-type'] || Object.keys(req.query).length > 0) {
            logger.error('Payload or query parameters not allowed in the request.');
            return responseHandler.setError(new Error("Payload not allowed"), res, 400);
        }

        const email = req.user.email;
        const user = await User.findOne({ where: { email } });
        if (!user) {
            logger.error(`User not found with email: ${email}`);
            return responseHandler.setError(new Error("User not found"), res, 404);
        }

        // Check if the user has an associated profile image
        const image = await Image.findOne({ where: { user_id: user.uuid } });
        if (!image) {
            logger.error(`No profile image found for User ID: ${user.uuid}`);
            return responseHandler.setError(new Error("Profile image not found"), res, 404);
        }

        // Delete the image from S3 and the database
        await imageService.deleteImageService(image, user.uuid);
        
        logger.info(`Profile image deleted successfully for User ID: ${user.uuid}`);
        return responseHandler.setResponse(res, 204);

    } catch (error) {
        logger.error(`Error deleting profile image: ${error.message}`);
        return responseHandler.setError(new Error('Error while deleting profile image'), res, 500);
    } finally {
        const duration = Date.now() - startTime;
        statsd.timing('api.delete.user.profileImage.response_time', duration);
    }
};
