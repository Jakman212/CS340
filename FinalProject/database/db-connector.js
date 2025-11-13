// database/db-connector.js
// Database connection configuration

var mysql = require('mysql');

// Create connection pool
// TODO: Update these values with your actual database credentials
var pool = mysql.createPool({
    connectionLimit : 10,
    host            : 'classmysql.engr.oregonstate.edu',
    user            : 'cs340_dempsjer',
    password        : 'pE9rOqR8pu0N',
    database        : 'cs340_dempsjer'
});
// Export the pool
module.exports.pool = pool;