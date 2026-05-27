/**
 * Cloudinary URL Helpers
 */

/**
 * Dynamically replaces the cloud name in a Cloudinary URL with the current one from environment variables.
 * Format: https://res.cloudinary.com/<CLOUD_NAME>/image/upload/...
 * 
 * @param {string} url - The original Cloudinary URL
 * @returns {string} - The URL with the updated cloud name
 */
export const fixCloudinaryUrl = (url) => {
    if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
        return url;
    }

    const currentCloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!currentCloudName) {
        return url;
    }

    // Replace the segment after res.cloudinary.com/
    return url.replace(/(res\.cloudinary\.com\/)[^/]+(\/image\/upload)/, `$1${currentCloudName}$2`);
};

/**
 * Fixes all Cloudinary URLs in a document (or array of documents)
 * Useful for .lean() queries where getters don't run.
 * 
 * @param {Object|Array} data - The document or array of documents to fix
 * @param {Array<string>} fields - The fields containing Cloudinary URLs
 * @returns {Object|Array} - The data with fixed URLs
 */
export const fixLeanUrls = (data, fields = ['image', 'icon', 'profileImage', 'licensePhoto', 'aadharPhoto', 'panPhoto']) => {
    if (!data) return data;

    const fixDoc = (doc) => {
        fields.forEach(field => {
            if (doc[field]) {
                if (Array.isArray(doc[field])) {
                    doc[field] = doc[field].map(item => typeof item === 'string' ? fixCloudinaryUrl(item) : item);
                } else if (typeof doc[field] === 'string') {
                    doc[field] = fixCloudinaryUrl(doc[field]);
                }
            }
        });
        return doc;
    };

    if (Array.isArray(data)) {
        return data.map(fixDoc);
    }

    return fixDoc(data);
};
