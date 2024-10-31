import healthRouter from './health-route.js'; // To import health check routes
import userRoutes from './user-routes.js';// To import the user routes
import imageRoutes from './s3image-route.js'; // To import the image routes

const initializeRoutes =(app)=>{
    app.use('/healthz', healthRouter); //Using the health check router
    app.use('/v1/user', userRoutes); //Using the user routes 
    //app.use('v1/user');
    // app.use('/v1/user', imageRoutes);
};

export default initializeRoutes;