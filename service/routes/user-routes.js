import express from 'express';
import * as userController from '../controllers/user-controller.js';
import userAuth from '../services/auth-service.js';
import * as responseHandler from '../controllers/response-handler.js';

const router = express.Router();

// Route to handle HEAD requests
router.head('/self', (req, res) => {
    return responseHandler.setError(new Error('Method Not Allowed.'),res,405);
    
});

router.post('/', userController.createUserController);
router.get("/self", userAuth, userController.getSelfUserController );
router.put("/self", userAuth, userController.updateSelfUserController);

// Middleware to handle unsupported methods
router.all('/', (req, res) => {
    return responseHandler.setError(new Error('Method Not Allowed.'),res,405);
});

// Middleware to handle unsupported methods
router.all('/self', (req, res) => {
    return responseHandler.setError(new Error('Method Not Allowed.'),res,405);
});

// Middleware to handle  invalid endpoints
router.use((req, res) => {
    return responseHandler.setError(new Error('Invalid request'), res, 404);
});

export default router;