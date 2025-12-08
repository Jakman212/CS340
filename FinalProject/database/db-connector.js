// database/db-connector.js
// Database connection configuration

var mysql = require('mysql');

// Create connection pool
// TODO: Update these values with your actual database credentials
var pool = mysql.createPool({
    connectionLimit : 10,
    host            : 'classmysql.engr.oregonstate.edu',
    user            : '[your ONID here]',
    password        : '[your database password here]',
    database        : '[your ONID here]'
});
// Export the pool
module.exports.pool = pool;