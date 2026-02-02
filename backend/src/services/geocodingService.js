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

            // 2. Progressive Fallback: Remove specific details from start (Door No, Landmark)
            if (!result && cleanAddress.includes(',')) {
                let parts = cleanAddress.split(',').map(p => p.trim());

                // Try removing up to 2 parts from the start
                for (let i = 1; i < parts.length && i <= 2; i++) {
                    if (result) break;
                    const fallbackAddress = parts.slice(i).join(', ');
                    if (fallbackAddress.length < 5) break;

                    console.log(`[Geocoding] Fallback attempt ${i}: ${fallbackAddress}`);
                    result = await fetchCoords(fallbackAddress);
                }

                // 3. Ultra Fallback: Try just the last part (usually City/Pincode)
                if (!result && parts.length > 1) {
                    const lastPart = parts[parts.length - 1];
                    const secondLast = parts.length > 2 ? parts[parts.length - 2] : '';
                    if (lastPart.match(/\d{6}/)) { // Contains pincode
                        // Try City + Pincode
                        const cityPincode = `${secondLast}, ${lastPart}`;
                        console.log(`[Geocoding] Pincode Fallback: ${cityPincode}`);
                        result = await fetchCoords(cityPincode);
                    }
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

    /**
     * Get address from coordinates (Reverse Geocoding)
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {Promise<object|null>} Address details
     */
    async getAddress(lat, lng) {
        try {
            if (!lat || !lng) return null;

            const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
                params: {
                    lat,
                    lon: lng,
                    format: 'json',
                },
                headers: {
                    'User-Agent': 'TeasNTreesApp/1.0'
                }
            });

            if (response.data && response.data.display_name) {
                return {
                    formattedAddress: response.data.display_name,
                    details: response.data.address
                };
            }
            return null;
        } catch (error) {
            logger.error('Reverse geocoding error:', error.message);
            return null;
        }
    }
}

export const geocodingService = new GeocodingService();
