import { initServer } from './src/configs/app.js';
import dotenv from 'dotenv';

dotenv.config();

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception in Opinion Manager Server:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection in Opinion Manager Server:', reason);
    process.exit(1);
});

console.log('Starting Opinion Manager...');

initServer();