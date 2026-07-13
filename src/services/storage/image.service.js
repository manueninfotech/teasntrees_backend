import sharp from 'sharp';

export const imageService = {
    /**
     * Optimizes an image buffer (resize, convert to WebP, compress)
     * @param {Buffer} buffer - Original image buffer
     * @returns {Promise<{ buffer: Buffer, info: sharp.OutputInfo }>}
     */
    async optimizeImage(buffer) {
        // Resize to max 1920px width/height, preserving aspect ratio, without enlarging
        // Convert to WebP, compress at 80% quality
        const pipeline = sharp(buffer)
            .resize(1920, 1920, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .withMetadata(false); // Strip EXIF data

        const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
        
        return {
            buffer: data,
            width: info.width,
            height: info.height,
            format: info.format
        };
    }
};
