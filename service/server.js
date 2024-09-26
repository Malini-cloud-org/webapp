
import express from 'express';
import initialize from  './app.js'; // To initialize routes


const app = express();
const port = process.env.PORT;

app.use(express.json());

initialize(app); // Calling the initialize function from app.js

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

