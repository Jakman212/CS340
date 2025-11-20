// app.js
// Main Express application for Study Application
// Will update comment blocks as routes are added
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
var db = require('./database/db-connector');

// Middleware to parse form data
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Static files (CSS, images, etc.)
app.use(express.static('public'));

/*
    ROUTES
*/

// ==================== HOME PAGE ====================
app.get('/', function(req, res) {
    res.render('index');
});

// ==================== USERS ROUTES ====================

// Browse Users
app.get('/users', function(req, res) {
    // Query to get all users
    let query1 = "SELECT user_id, username, email, join_date FROM Users ORDER BY user_id;";
    
    db.pool.query(query1, function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        res.render('users', {data: rows});
    });
});

// Add New User
app.post('/add-user', function(req, res) {
    let data = req.body;
    
    let query1 = `INSERT INTO Users (username, email, password_hash, join_date) 
                  VALUES (?, ?, ?, ?)`;
    let values = [
        data['username'],
        data['email'],
        data['password_hash'],
        data['join_date']
    ];
    
    db.pool.query(query1, values, function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        res.redirect('/users');
    });
});

// Get Single User (for update form)
app.get('/users/:id', function(req, res) {
    let userId = req.params.id;
    let query1 = "SELECT * FROM Users WHERE user_id = ?";
    
    db.pool.query(query1, [userId], function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        res.json(rows[0]);
    });
});

// Update User
app.put('/update-user', function(req, res) {
    let data = req.body;
    
    let query1 = `UPDATE Users 
                  SET username = ?, email = ?, password_hash = ? 
                  WHERE user_id = ?`;
    let values = [
        data['username'],
        data['email'],
        data['password_hash'],
        data['user_id']
    ];
    
    db.pool.query(query1, values, function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        res.sendStatus(200);
    });
});

// Delete User
app.delete('/delete-user/:id', function(req, res) {
    let userId = req.params.id;
    let query1 = `DELETE FROM Users WHERE user_id = ?`;
    
    db.pool.query(query1, [userId], function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        res.sendStatus(204);
    });
});

// ==================== STUDYSETS ROUTES ====================

// Browse StudySets
app.get('/studysets', function(req, res) {
    // Query to get all study sets with owner information
    let query1 = `SELECT StudySets.set_id, StudySets.title, StudySets.subject, 
                         StudySets.created_at, Users.username as owner_name, StudySets.user_id
                  FROM StudySets 
                  JOIN Users ON StudySets.user_id = Users.user_id 
                  ORDER BY StudySets.set_id;`;
    
    // Query to get all users for the dropdown
    let query2 = "SELECT user_id, username FROM Users ORDER BY username;";
    
    db.pool.query(query1, function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        let studysets = rows;
        
        db.pool.query(query2, function(error, rows, fields) {
            if (error) {
                console.log(error);
                res.sendStatus(500);
                return;
            }
            
            let users = rows;
            res.render('studysets', {data: studysets, users: users});
        });
    });
});

// Add New StudySet
app.post('/add-studyset', function(req, res) {
    let data = req.body;
    
    let query1 = `INSERT INTO StudySets (user_id, title, subject, created_at) 
                  VALUES (?, ?, ?, ?)`;
    let values = [
        data['user_id'],
        data['title'],
        data['subject'],
        data['created_at']
    ];
    
    db.pool.query(query1, values, function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        res.redirect('/studysets');
    });
});

// Get Single StudySet (for update form)
app.get('/studysets/:id', function(req, res) {
    let setId = req.params.id;
    let query1 = "SELECT * FROM StudySets WHERE set_id = ?";
    
    db.pool.query(query1, [setId], function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        res.json(rows[0]);
    });
});

// Update StudySet
app.put('/update-studyset', function(req, res) {
    let data = req.body;
    
    let query1 = `UPDATE StudySets 
                  SET user_id = ?, title = ?, subject = ? 
                  WHERE set_id = ?`;
    let values = [
        data['user_id'],
        data['title'],
        data['subject'],
        data['set_id']
    ];
    
    db.pool.query(query1, values, function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        res.sendStatus(200);
    });
});

// Delete StudySet
app.delete('/delete-studyset/:id', function(req, res) {
    let setId = req.params.id;
    let query1 = `DELETE FROM StudySets WHERE set_id = ?`;
    
    db.pool.query(query1, [setId], function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        res.sendStatus(204);
    });
});

// ==================== FLASHCARDS ROUTES ====================

// Browse Flashcards
app.get('/flashcards', function(req, res) {
    // Query to get all flashcards with study set information
    let query1 = `SELECT Flashcards.card_id, Flashcards.front_text, Flashcards.back_text, 
                         Flashcards.difficulty_level, StudySets.title as set_title, Flashcards.set_id
                  FROM Flashcards 
                  JOIN StudySets ON Flashcards.set_id = StudySets.set_id 
                  ORDER BY Flashcards.card_id;`;
    
    // Query to get all study sets for the dropdown
    let query2 = "SELECT set_id, title FROM StudySets ORDER BY title;";
    
    db.pool.query(query1, function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        let flashcards = rows;
        
        db.pool.query(query2, function(error, rows, fields) {
            if (error) {
                console.log(error);
                res.sendStatus(500);
                return;
            }
            
            let studysets = rows;
            res.render('flashcards', {data: flashcards, studysets: studysets});
        });
    });
});

// Add New Flashcard
app.post('/add-flashcard', function(req, res) {
    let data = req.body;
    
    let query1 = `INSERT INTO Flashcards (set_id, front_text, back_text, difficulty_level) 
                  VALUES (?, ?, ?, ?)`;
    let values = [
        data['set_id'],
        data['front_text'],
        data['back_text'],
        data['difficulty_level']
    ];
    
    db.pool.query(query1, values, function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        res.redirect('/flashcards');
    });
});

// Get Single Flashcard (for update form)
app.get('/flashcards/:id', function(req, res) {
    let cardId = req.params.id;
    let query1 = "SELECT * FROM Flashcards WHERE card_id = ?";
    
    db.pool.query(query1, [cardId], function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        res.json(rows[0]);
    });
});

// Update Flashcard
app.put('/update-flashcard', function(req, res) {
    let data = req.body;
    
    let query1 = `UPDATE Flashcards 
                  SET set_id = ?, front_text = ?, back_text = ?, difficulty_level = ? 
                  WHERE card_id = ?`;
    let values = [
        data['set_id'],
        data['front_text'],
        data['back_text'],
        data['difficulty_level'],
        data['card_id']
    ];
    
    db.pool.query(query1, values, function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        res.sendStatus(200);
    });
});

// Delete Flashcard
app.delete('/delete-flashcard/:id', function(req, res) {
    let cardId = req.params.id;
    let query1 = `DELETE FROM Flashcards WHERE card_id = ?`;
    
    db.pool.query(query1, [cardId], function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        res.sendStatus(204);
    });
});

// ==================== QUIZZES ROUTES ====================

// Browse Quizzes
app.get('/quizzes', function(req, res) {
    // Query to get all quizzes with user information
    let query1 = `SELECT Quizzes.quiz_id, Quizzes.score, Quizzes.attempt_date, 
                         Users.username as taker_name, Quizzes.user_id
                  FROM Quizzes 
                  JOIN Users ON Quizzes.user_id = Users.user_id 
                  ORDER BY Quizzes.quiz_id;`;
    
    // Query to get all users for the dropdown
    let query2 = "SELECT user_id, username FROM Users ORDER BY username;";
    
    db.pool.query(query1, function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        let quizzes = rows;
        
        db.pool.query(query2, function(error, rows, fields) {
            if (error) {
                console.log(error);
                res.sendStatus(500);
                return;
            }
            
            let users = rows;
            res.render('quizzes', {data: quizzes, users: users});
        });
    });
});

// Add New Quiz
app.post('/add-quiz', function(req, res) {
    let data = req.body;
    
    let query1 = `INSERT INTO Quizzes (user_id, score, attempt_date) 
                  VALUES (?, ?, ?)`;
    let values = [
        data['user_id'],
        data['score'],
        data['attempt_date']
    ];
    
    db.pool.query(query1, values, function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        res.redirect('/quizzes');
    });
});

// Get Single Quiz (for update form)
app.get('/quizzes/:id', function(req, res) {
    let quizId = req.params.id;
    let query1 = "SELECT * FROM Quizzes WHERE quiz_id = ?";
    
    db.pool.query(query1, [quizId], function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        res.json(rows[0]);
    });
});

// Update Quiz
app.put('/update-quiz', function(req, res) {
    let data = req.body;
    
    let query1 = `UPDATE Quizzes 
                  SET user_id = ?, score = ? 
                  WHERE quiz_id = ?`;
    let values = [
        data['user_id'],
        data['score'],
        data['quiz_id']
    ];
    
    db.pool.query(query1, values, function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        res.sendStatus(200);
    });
});

// Delete Quiz
app.delete('/delete-quiz/:id', function(req, res) {
    let quizId = req.params.id;
    let query1 = `DELETE FROM Quizzes WHERE quiz_id = ?`;
    
    db.pool.query(query1, [quizId], function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        res.sendStatus(204);
    });
});

// ==================== RESET DATABASE ROUTES ====================

app.get('/reset-database', async function (req, res) {
    try {
        console.log('Resetting database...');
        await db.query('CALL sp_reset_database();');
        console.log('Database reset successfully!');
        res.send(`
            <h1>✅ Database Reset Successfully!</h1>
            <p>All tables have been dropped and recreated with sample data.</p>
            <a href="/">Go to Home</a> | 
            <a href="/users">View Users</a>
        `);
    } catch (error) {
        console.error('Error resetting database:', error);
        res.status(500).send('Error resetting database: ' + error.message);
    }
});

/*
    LISTENER
*/
app.listen(PORT, function() {
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.');
});