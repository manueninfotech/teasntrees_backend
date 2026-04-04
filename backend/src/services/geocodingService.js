import axios from 'axios';
import logger from '../config/logger.js';

class GeocodingService {
    constructor() {
        this.cache = new Map();
        this.inFlightRequests = new Map();
        this.CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
        this.NEGATIVE_CACHE_TTL = 60 * 1000; // 1 min for failures
    }

    _getCached(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp < (cached.data === null ? this.NEGATIVE_CACHE_TTL : this.CACHE_TTL))) {
            return cached.data;
        }
        return null;
    }

    _setCached(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
        if (this.cache.size > 5000) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    /**
     * Get coordinates from address string
     * @param {string} address - The address to geocode
     * @returns {Promise<{lat: number, lng: number}|null>}
     */
    async getCoordinates(address) {
        if (!address || address.length < 3) return null;
        const cleanAddress = address.replace(/[#]/g, '').trim().toLowerCase();
        const cacheKey = `geo:${cleanAddress}`;

        const cached = this._getCached(cacheKey);
        if (cached !== null) return cached;

        if (this.inFlightRequests.has(cacheKey)) return this.inFlightRequests.get(cacheKey);

        const requestPromise = (async () => {
            try {
                const fetchCoords = async (query) => {
                    await new Promise(r => setTimeout(r, 100)); // Buffer to stay under 1 req/s across users
                    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                        params: { q: query, format: 'json', limit: 1 },
                        headers: { 'User-Agent': 'TeasNTreesApp-SpeedTest/1.2' }
                    });
                    return response.data && response.data.length > 0 ? response.data[0] : null;
                };

                let result = await fetchCoords(cleanAddress);

                // Progressive Fallback
                if (!result && cleanAddress.includes(',')) {
                    let parts = cleanAddress.split(',').map(p => p.trim());
                    for (let i = 1; i < parts.length && i <= 2; i++) {
                        if (result) break;
                        const fallbackAddress = parts.slice(i).join(', ');
                        if (fallbackAddress.length < 5) break;
                        result = await fetchCoords(fallbackAddress);
                    }
                    if (!result && parts.length > 1) {
                        const lastPart = parts[parts.length - 1];
                        if (lastPart.match(/\d{6}/)) { // Pincode
                            result = await fetchCoords(lastPart);
                        }
                    }
                }

                if (result) {
                    const data = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
                    this._setCached(cacheKey, data);
                    return data;
                }

                this._setCached(cacheKey, null);
                return null;
            } catch (error) {
                logger.error('Geocoding error:', error.message);
                this._setCached(cacheKey, null);
                return null;
            } finally {
                this.inFlightRequests.delete(cacheKey);
            }
        })();

        this.inFlightRequests.set(cacheKey, requestPromise);
        return requestPromise;
    }

    /**
     * Get address from coordinates (Reverse Geocoding)
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {Promise<object|null>} Address details
     */
    async getAddress(lat, lng) {
        if (!lat || !lng) return null;
        const cacheKey = `rev:${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;

        const cached = this._getCached(cacheKey);
        if (cached !== null) return cached;

        if (this.inFlightRequests.has(cacheKey)) return this.inFlightRequests.get(cacheKey);

        const requestPromise = (async () => {
            try {
                await new Promise(r => setTimeout(r, 200));
                const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
                    params: { lat, lon: lng, format: 'json' },
                    headers: { 'User-Agent': 'TeasNTreesApp-SpeedTest/1.2' }
                });

                if (response.data && response.data.display_name) {
                    const data = {
                        formattedAddress: response.data.display_name,
                        details: response.data.address
                    };
                    this._setCached(cacheKey, data);
                    return data;
                }
                this._setCached(cacheKey, null);
                return null;
            } catch (error) {
                logger.error('Reverse geocoding error:', error.message);
                this._setCached(cacheKey, null);
                return null;
            } finally {
                this.inFlightRequests.delete(cacheKey);
            }
        })();

        this.inFlightRequests.set(cacheKey, requestPromise);
        return requestPromise;
    }
}

export const geocodingService = new GeocodingService();
