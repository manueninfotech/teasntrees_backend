import axios from 'axios';
import logger from '../config/logger.js';

class GeocodingService {
    /**
     * Get coordinates from address string
     * @param {string} address - The address to geocode
     * @returns {Promise<{lat: number, lng: number}|null>}
     */
    async getCoordinates(address) {
        try {
            if (!address || address.length < 3) return null;

            // Clean address: remove special characters that might confuse Nominatim
            const cleanAddress = address.replace(/[#]/g, '').trim();

            const fetchCoords = async (query) => {
                const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                    params: {
                        q: query,
                        format: 'json',
                        limit: 1
                    },
                    headers: {
                        'User-Agent': 'TeasNTreesApp/1.0'
                    }
                });
                return response.data && response.data.length > 0 ? response.data[0] : null;
            };

            // 1. Try exact address
            let result = await fetchCoords(cleanAddress);

            // 2. Fallback: If failed, try removing specific details (like Door Numbers, Flat Names)
            // We split by comma and remove the first part iteratively
            if (!result && cleanAddress.includes(',')) {
                const parts = cleanAddress.split(',');
                if (parts.length > 1) {
                    const fallbackAddress = parts.slice(1).join(',').trim();
                    console.log(`[Geocoding] Fallback attempt: ${fallbackAddress}`);
                    result = await fetchCoords(fallbackAddress);
                }
            }

            if (result) {
                logger.info(`Geocoded address: ${address} -> [${result.lat}, ${result.lon}]`);
                return {
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon)
                };
            }

            logger.warn(`Could not geocode address: ${address}`);
            return null;
        } catch (error) {
            logger.error('Geocoding error:', error.message);
            return null;
        }
    }
}

export const geocodingService = new GeocodingService();
