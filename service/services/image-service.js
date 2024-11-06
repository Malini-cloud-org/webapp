

import AWS from 'aws-sdk';
import Image from '../models/Image.js';
import logger from '../lib/logger.js';
import statsd from '../lib/statsd.js';


// Initialize S3 client
const s3 = new AWS.S3();

export const uploadImageService = async (file, userId) => {
    
    try {
        const fileExtension = file.mimetype.split('/')[1];
        const fileKey = `user-${userId}-${file.originalname}`;

        const params = {
            Bucket: process.env.S3_BUCKET_NAME, // Ensure the bucket name is set in the environment
            Key: fileKey,
            Body: file.buffer, // Use file.buffer directly from memory
            ContentType: file.mimetype,
            Metadata: {
                userId,
                uploadDate: new Date().toISOString(),
            },
        };

        // Upload the file to S3
        const startTime = Date.now();
        const s3Response = await s3.upload(params).promise();
        statsd.timing('s3.upload.time', Date.now() - startTime);

        // Save image metadata in the database
        const newImage = await Image.create({
            file_name: fileKey,
            url: s3Response.Location,
            user_id: userId,
        });

        logger.info(`Image uploaded successfully for user ID ${userId}: ${s3Response.Location}`);
        return newImage;
    } catch (error) {
        logger.error("Error uploading image to S3 and saving metadata:", error);
        throw new Error("Failed to upload image.");
    }
};

export const getImageService = async (userId) => {
    const startTime = Date.now();
    try {
        const image = await Image.findOne({ where: { user_id: userId } });
        return image;

    } catch (error) {
        logger.error("Error retrieving profile image:", error);
        throw new Error("Failed to retrieve image.");
    } finally {
        statsd.timing('service.getImageService.total_time', Date.now() - startTime);
    }
};

export const deleteImageService = async (image, userId) => {
    const startTime = Date.now();
    try {
       
        const fileKey = image.fileKey;
        const s3DeleteStart = Date.now();
        // Delete from S3
        const deleteParams = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: image.file_name, // Ensure the key structure matches upload service
        };
       
        await s3.deleteObject(deleteParams).promise();
        statsd.timing('s3.delete.time', Date.now() - s3DeleteStart);

        // Delete from the database
        const dbDeleteStart = Date.now();
        await Image.destroy({ where: { id: image.id } });
        statsd.timing('db.image_delete.time', Date.now() - dbDeleteStart);
        logger.info(`Image metadata removed for User ID: ${userId}`);
        
    } catch (error) {
        logger.error("Error deleting image from S3 and database:", error);
        throw new Error("Failed to delete image.");
    }
    finally {
        statsd.timing('service.deleteImageService.total_time', Date.now() - startTime);
    }
};