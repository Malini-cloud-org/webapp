import StatsD from 'node-statsd';

// Initialize the StatsD client
const statsd = new StatsD({
    host: 'localhost',  // Change this to your StatsD server host if needed
    port: 8125,         
    prefix: 'webapp'   
});

export default statsd;
