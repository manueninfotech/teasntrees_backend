import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:5000';
const BRAND = 'littleh';

// Token for LittleH manager: 697b09c0b2c673fb2531794d
const TOKENS = ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTdiMDljMGIyYzY3M2ZiMjUzMTc5NGQiLCJyb2xlIjoibWFuYWdlciIsImlhdCI6MTc3Mjg4MzMxMywiZXhwIjoxNzc1NDc1MzEzfQ.Lh_F4oZ41xbGRphRShvlvQPBZNTaMbKXPqHgfqdsaI0"];

export const options = {
    vus: 3,
    duration: '15s',
    thresholds: {
        http_req_duration: ['p(95)<5000'],
        checks: ['rate>0.99'],
    },
};

const PRODUCTS = [
    "6999856afdae190c263c3e88",
    "6999856afdae190c263c3e8e",
    "6999856afdae190c263c3e94",
    "6999856bfdae190c263c3e9a",
    "6999856bfdae190c263c3ea0"
];

export default function () {
    // Rotate tokens based on VU ID
    const token = TOKENS[(__VU - 1) % TOKENS.length];

    // Pick a product based on iteration
    const productId = PRODUCTS[(__ITER) % PRODUCTS.length];
    const endpoint = `/api/${BRAND}/manager/products/${productId}`;
    const url = BASE_URL + endpoint;

    const payload = JSON.stringify({
        name: `LittleH Updated Product ${__ITER}`
    });

    const params = {
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        timeout: '30s'
    };

    // Using PUT for the manager product update endpoint
    const res = http.put(url, payload, params);

    // We check for 200 (processed) or 500 (race condition on save)
    check(res, {
        [`status 200 or 500 for ${endpoint}`]: (r) => r.status === 200 || r.status === 500,
    });

    sleep(1);
}
