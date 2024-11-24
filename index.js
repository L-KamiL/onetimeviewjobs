import cron from 'node-cron';
import { config } from 'dotenv';

config();

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const CRON_SECRET_TOKEN = process.env.CRON_SECRET_TOKEN;

// Ensure CRON_SECRET_TOKEN is set
if (!CRON_SECRET_TOKEN) {
    console.error('CRON_SECRET_TOKEN is not set in environment variables');
    process.exit(1);
}

async function callCronEndpoint(endpoint) {
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${API_BASE_URL}/api/cron/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Cron-Token': CRON_SECRET_TOKEN
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`${endpoint} response:`, data);
    } catch (error) {
        console.error(`Error calling ${endpoint}:`, error);
    }
}

// Schedule cron jobs
// Run file cleanup every hour
cron.schedule('0 * * * *', () => {
    console.log('Running file cleanup...');
    callCronEndpoint('cleanup-files');
});

// Check subscriptions every 12 hours
cron.schedule('0 */12 * * *', () => {
    console.log('Checking subscriptions...');
    callCronEndpoint('check-subscriptions');
});

// Initial run on startup
console.log('Starting cron jobs...');
callCronEndpoint('cleanup-files');
callCronEndpoint('check-subscriptions');

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Shutting down...');
    process.exit(0);
});
