import { storageService } from './storage.service.js';
import { imageService } from './image.service.js';
import logger from '../../config/logger.js';

export const uploadService = {
    /**
     * Upload and optimize a public image
     * @param {Buffer} buffer - Image buffer
     * @param {string} folder - Target folder
     */
    async uploadPublicImage(buffer, folder = 'teasntrees') {
        try {
            const { buffer: optimizedBuffer, width, height, format } = await imageService.optimizeImage(buffer);
            
            const result = await storageService.saveFile(optimizedBuffer, folder, format);
            
            return {
                url: result.url,
                publicId: result.publicId,
                width,
                height,
                format
            };
        } catch (error) {
            logger.error('Error in uploadPublicImage:', error);
            throw new Error(`Failed to upload image: ${error.message}`);
        }
    },

    /**
     * Upload a private file without optimization
     * @param {Buffer} buffer - File buffer
     * @param {string} folder - Target folder
     * @param {string} mimeType - File mimetype
     */
    async uploadPrivateFile(buffer, folder = 'temp', mimeType = 'application/octet-stream') {
        try {
            // Extract extension from mimeType or use a default
            let extension = mimeType.split('/')[1] || 'bin';
            if (extension === 'jpeg') extension = 'jpg';
            
            const result = await storageService.saveFile(buffer, folder, extension);
            
            return {
                url: result.url,
                publicId: result.publicId
            };
        } catch (error) {
            logger.error('Error in uploadPrivateFile:', error);
            throw new Error(`Failed to upload private file: ${error.message}`);
        }
    },

    /**
     * Delete file by publicId
     * @param {string} publicId 
     */
    async deleteFile(publicId) {
        const success = await storageService.deleteFile(publicId);
        return { result: success ? 'ok' : 'failed' };
    },

    /**
     * Extract publicId from URL
     */
    extractPublicId(url) {
        return storageService.extractPublicId(url);
    }
};

// ALIASES to drop-in replace existing calls with minimal controller changes
export const uploadToCloudinary = (buffer, folder) => uploadService.uploadPublicImage(buffer, folder);
export const uploadToAzure = (buffer, folder, mimeType) => uploadService.uploadPrivateFile(buffer, folder, mimeType);
export const deleteFromCloudinary = (publicId) => uploadService.deleteFile(publicId);
export const deleteFromAzure = (publicId) => uploadService.deleteFile(publicId);
export const extractPublicId = (url) => uploadService.extractPublicId(url);
