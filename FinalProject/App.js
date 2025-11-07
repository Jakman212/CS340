// app.js
// main express application for Study Application

// Express
var express = require('express');
var app = express();
const PORT = 6851;

// Handlebars
var exphbs = require('express-handlebars');
app.engine('.hbs', exphbs.engine({
    extname: ".hbs"
}));
app.set('view engine', '.hbs');

// Database
var db = require('./database/db-connector')

// Middleware to parse form data
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Static files (CSS, images, etc.)
app.use(express.static('public'));

/*
    ROUTES
*/

// Home page
app.get('/', function(req, res){
    res.render('index');
});

// Users routes
app.get('./users', function(req, res) {
    // Query to get all users
    let query1 = "SELECT user_id, username, email, join_date FROM Users ORDER BY user_id;"

    db.pool.query(query1, function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }

        res.render('users', {data: rows});
    });
});

// CRUD operations (Create, Read, Update, Delete)
// Add new user
app.post('/add-user', function(req, res) {
    // Capture the incoming data
    let data = req.body;

    // Create the query
    let query1 = 'INSERT INTO Users (username, email, password_hash, join_date) VALUES (?, ?, ?, ?)'
    let values = [
        data['username'],
        data['email'],
        data['password_hash'],
        data['join_date'],
    ];

    // Run the query
    db.pool.query(query1, values, function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }

        // Redirect back to users page
        res.redirect('/users');
    });
});

// Delete user
app.delete('/delete-user/:id', function(req, res) {
    let userID = req.params.id;

    let query1 = 'DELETE FROM Users WHERE user_id = ?';

    db.pool.query(query1, [userID], function(error, rows, fields) {
        if (error) {
            console.log(error)
            res.sendStatus(500);
            return;
        }

         res.sendStatus(204);
    });  
});

// Get user for update
app.get('/users/:id', function(req, res) {
    let userID = req.params.id;

    let query1 = "SELECT * FROM Users WHERE user_id = ?";

    db.pool.query(query1, [userID], function(error, rows, fields) {
        if (error) {
            console.log(error)
            res.sendStatus(500);
            return;
        }

        res.json(rows[0]);
    });
});

// Update user
app.put('update-user', function(req, res) {
    let data = req.body;

    let query1 = 'UPDATE Users SET username = ?, email = ?, password_hash = ? WHERE user_id = ?';

    let values = [
        data['username'],
        data['email'],
        data['password_hash'],
        data['user_id'],
    ];

    db.pool.query(query1, values, function(error, rows, fields) {
        if (error) {
            console.log(error)
            res.sendStatus(500);
            return;
        }

        res.sendStatus(200);
    });
})

/*
    LISTENER
*/
app.listen(PORT, function() {
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.');
});
