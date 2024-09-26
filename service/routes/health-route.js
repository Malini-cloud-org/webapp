import express from "express";
import * as healthController from '../controllers/health-controller.js'; // Importing the controller

const router = express.Router();

//Defining route for health check
router.all('/', healthController.checkDatabaseConnection);
      
export default router;