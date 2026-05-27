import { uploadToCloudinary, deleteFromCloudinary, extractPublicId } from "../../utils/imageUpload.js";
import activityLogService from '../../services/activityLogService.js';

// Upload single image
export const uploadImage = async (req, res) => {
    try {
        // check if file exists
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file file uploaded'
            });
        }
        // Get folder from query  or default to 'teasntrees'
        const folder = req.query.folder || 'teasntrees';
        // upload to cloudinary
        const result = await uploadToCloudinary(req.file.buffer, folder);

        // return result
        const responseData = {
            url: result.url,
            publicId: result.publicId,
            width: result.width,
            height: result.height,
            format: result.format,
        };

        // Log Activity
        await activityLogService.log(req, {
            action: 'upload',
            resource: 'image',
            details: { folder, publicId: result.publicId }
        });

        return res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: responseData
        });
    } catch (error) {
        console.error('Upload error', error)
        return res.status(500).json({
            success: false,
            message: 'Error uploading image',
            error: error.message
        });
    }
};

// Delete image by public id or url
export const deleteImage = async (req, res) => {
    try {
        const { publicId, url } = req.body;
        let imagePublicId = publicId;
        if (!imagePublicId && url) {
            imagePublicId = extractPublicId(url);
        }
        if (!imagePublicId) {
            return res.status(400).json({
                success: false,
                message: 'please provide public id or url'
            });
        }
        // delete from cloudinary
        const result = await deleteFromCloudinary(imagePublicId);
        if (result.result === 'ok') {
            res.status(200).json({
                success: true,
                message: 'Image deleted successfully'
            });

            // Log Activity
            await activityLogService.log(req, {
                action: 'delete',
                resource: 'image',
                details: { publicId: imagePublicId }
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Image not found or already deleted'
            });
        }
    } catch (error) {
        console.error('Delete error', error)
        return res.status(500).json({
            success: false,
            message: 'Failed to delete image',
            error: error.message
        });
    }
};

// Upload multiple images
export const uploadMultipleImages = async (req, res) => {
    try {
        // check if files exists
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No image files provided'
            });
        }
        const folder = req.query.folder || 'teasntrees';
        // Upload all images to cloudinary
        const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer, folder));
        const results = await Promise.all(uploadPromises);
        const responseData = results.map(result => ({
            url: result.url,
            publicId: result.publicId,
            width: result.width,
            height: result.height,
            format: result.format,
        }));

        // Log Activity
        await activityLogService.log(req, {
            action: 'upload',
            resource: 'image',
            details: { folder, count: results.length }
        });

        return res.status(200).json({
            success: true,
            message: `${results.length} Images uploaded successfully`,
            data: responseData
        });
    } catch (error) {
        console.error('Upload error', error)
        return res.status(500).json({
            success: false,
            message: 'Failed to upload images',
            error: error.message
        });
    }
}