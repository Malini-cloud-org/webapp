import healthRouter from './health-route.js'; // To import health check routes
import userRoutes from './user-routes.js';// To import the user routes



const initializeRoutes =(app)=>{
    app.use('/healthz', healthRouter); //Using the health check router
    app.use('/v1/user', userRoutes); //Using the user routes 

    app.use('/cicd', healthRouter);
    
};

export default initializeRoutes;
