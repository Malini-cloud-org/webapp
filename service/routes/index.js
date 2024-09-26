import healthRouter from './health-route.js'; // To import health check routes

const initializeRoutes =(app)=>{
    app.use('/healthz', healthRouter); //Using the health check router
};

export default initializeRoutes;