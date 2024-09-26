import express from 'express';

import initializeRoutes from "./routes/index.js"; //Route initialization

const initialize =(app)=>{
    app.use(express.json());
    initializeRoutes(app); // Initilaize routes
}
export default initialize;