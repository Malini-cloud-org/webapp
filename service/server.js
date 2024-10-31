
import express from 'express';
import initialize from  './app.js'; // To initialize routes
import logger from './lib/logger.js';

const app = express();
const port = process.env.PORT;

app.use(express.json());

initialize(app); // Calling the initialize function from app.js

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });

