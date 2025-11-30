// app.js
// Main Express application for Study Application
// Citation: Based on CS340 starter code and Node.js example
// Modified for Study Application database project

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
    let values = [data['username'], data['email'], data['password_hash'], data['join_date']];
    
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
    let query1 = `UPDATE Users SET username = ?, email = ?, password_hash = ? WHERE user_id = ?`;
    let values = [data['username'], data['email'], data['password_hash'], data['user_id']];
    
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
    let query1 = `SELECT StudySets.set_id, StudySets.title, StudySets.subject, 
                         StudySets.created_at, Users.username as owner_name, StudySets.user_id
                  FROM StudySets 
                  JOIN Users ON StudySets.user_id = Users.user_id 
                  ORDER BY StudySets.set_id;`;
    
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
            res.render('studysets', {data: studysets, users: rows});
        });
    });
});

// Add New StudySet
app.post('/add-studyset', function(req, res) {
    let data = req.body;
    let query1 = `INSERT INTO StudySets (user_id, title, subject, created_at) 
                  VALUES (?, ?, ?, ?)`;
    let values = [data['user_id'], data['title'], data['subject'], data['created_at']];
    
    db.pool.query(query1, values, function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        res.redirect('/studysets');
    });
});

// Get Single StudySet
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
    let query1 = `UPDATE StudySets SET user_id = ?, title = ?, subject = ? WHERE set_id = ?`;
    let values = [data['user_id'], data['title'], data['subject'], data['set_id']];
    
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
    let query1 = `SELECT Flashcards.card_id, Flashcards.front_text, Flashcards.back_text, 
                         Flashcards.difficulty_level, StudySets.title as set_title, Flashcards.set_id
                  FROM Flashcards 
                  JOIN StudySets ON Flashcards.set_id = StudySets.set_id 
                  ORDER BY Flashcards.card_id;`;
    
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
            res.render('flashcards', {data: flashcards, studysets: rows});
        });
    });
});

// Add New Flashcard
app.post('/add-flashcard', function(req, res) {
    let data = req.body;
    let query1 = `INSERT INTO Flashcards (set_id, front_text, back_text, difficulty_level) 
                  VALUES (?, ?, ?, ?)`;
    let values = [data['set_id'], data['front_text'], data['back_text'], data['difficulty_level']];
    
    db.pool.query(query1, values, function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        res.redirect('/flashcards');
    });
});

// Get Single Flashcard
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
    let values = [data['set_id'], data['front_text'], data['back_text'], data['difficulty_level'], data['card_id']];
    
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
    let query1 = `SELECT Quizzes.quiz_id, Quizzes.score, Quizzes.attempt_date, 
                         Users.username as taker_name, Quizzes.user_id
                  FROM Quizzes 
                  JOIN Users ON Quizzes.user_id = Users.user_id 
                  ORDER BY Quizzes.quiz_id;`;
    
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
            res.render('quizzes', {data: quizzes, users: rows});
        });
    });
});

// Add New Quiz
app.post('/add-quiz', function(req, res) {
    let data = req.body;
    let query1 = `INSERT INTO Quizzes (user_id, score, attempt_date) VALUES (?, ?, ?)`;
    let values = [data['user_id'], data['score'], data['attempt_date']];
    
    db.pool.query(query1, values, function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        res.redirect('/quizzes');
    });
});

// Get Single Quiz
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
    let query1 = `UPDATE Quizzes SET user_id = ?, score = ? WHERE quiz_id = ?`;
    let values = [data['user_id'], data['score'], data['quiz_id']];
    
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

// ==================== USER_STUDYSETS ROUTES (Junction Table) ====================

app.get('/user-studysets', function(req, res) {
    let query1 = `SELECT uss.id, u.username, ss.title AS studyset_title, uss.shared_at
                  FROM User_StudySets uss
                  JOIN Users u ON uss.user_id = u.user_id
                  JOIN StudySets ss ON uss.set_id = ss.set_id
                  ORDER BY uss.shared_at DESC;`;
    
    let query2 = "SELECT user_id, username FROM Users ORDER BY username;";
    let query3 = "SELECT set_id, title FROM StudySets ORDER BY title;";
    
    db.pool.query(query1, function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        let relationships = rows;
        
        db.pool.query(query2, function(error, rows, fields) {
            if (error) {
                console.log(error);
                res.sendStatus(500);
                return;
            }
            
            let users = rows;
            
            db.pool.query(query3, function(error, rows, fields) {
                if (error) {
                    console.log(error);
                    res.sendStatus(500);
                    return;
                }
                
                res.render('user-studysets', {
                    relationships: relationships,
                    users: users,
                    studysets: rows
                });
            });
        });
    });
});

// ==================== USER_QUIZZES ROUTES (Junction Table) ====================

app.get('/user-quizzes', function(req, res) {
    let query1 = `SELECT uq.id, u.username, q.quiz_id AS quiz_title, uq.score, uq.taken_at
                  FROM User_Quizzes uq
                  JOIN Users u ON uq.user_id = u.user_id
                  JOIN Quizzes q ON uq.quiz_id = q.quiz_id
                  ORDER BY uq.taken_at DESC;`;
    
    let query2 = "SELECT user_id, username FROM Users ORDER BY username;";
    let query3 = "SELECT quiz_id FROM Quizzes ORDER BY quiz_id;";
    
    db.pool.query(query1, function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        let attempts = rows;
        
        db.pool.query(query2, function(error, rows, fields) {
            if (error) {
                console.log(error);
                res.sendStatus(500);
                return;
            }
            
            let users = rows;
            
            db.pool.query(query3, function(error, rows, fields) {
                if (error) {
                    console.log(error);
                    res.sendStatus(500);
                    return;
                }
                
                res.render('user-quizzes', {
                    attempts: attempts,
                    users: users,
                    quizzes: rows
                });
            });
        });
    });
});

// ==================== QUIZ_FLASHCARDS ROUTES (Junction Table) ====================

app.get('/quiz-flashcards', function(req, res) {
    let query1 = `SELECT qf.id, q.quiz_id AS quiz_title, f.front_text, ss.title AS studyset_title
                  FROM Quiz_Flashcards qf
                  JOIN Quizzes q ON qf.quiz_id = q.quiz_id
                  JOIN Flashcards f ON qf.card_id = f.card_id
                  JOIN StudySets ss ON f.set_id = ss.set_id
                  ORDER BY q.quiz_id, f.card_id;`;
    
    let query2 = "SELECT quiz_id FROM Quizzes ORDER BY quiz_id;";
    let query3 = `SELECT f.card_id, f.front_text, ss.title AS studyset_title
                  FROM Flashcards f
                  JOIN StudySets ss ON f.set_id = ss.set_id
                  ORDER BY ss.title, f.card_id;`;
    
    db.pool.query(query1, function(error, rows, fields) {
        if (error) {
            console.log(error);
            res.sendStatus(500);
            return;
        }
        
        let assignments = rows;
        
        db.pool.query(query2, function(error, rows, fields) {
            if (error) {
                console.log(error);
                res.sendStatus(500);
                return;
            }
            
            let quizzes = rows;
            
            db.pool.query(query3, function(error, rows, fields) {
                if (error) {
                    console.log(error);
                    res.sendStatus(500);
                    return;
                }
                
                res.render('quiz-flashcards', {
                    assignments: assignments,
                    quizzes: quizzes,
                    flashcards: rows
                });
            });
        });
    });
});

// ==================== STEP 4 ADMIN ROUTES ====================

// RESET Database
app.get('/reset-database', function(req, res) {
    let query1 = "CALL sp_reset_study_app();";
    
    db.pool.query(query1, function(error, rows, fields) {
        if (error) {
            console.log('Error resetting database:', error);
            res.status(500).send('Error resetting database: ' + error.message);
            return;
        }
        
        res.send(`
            <h1>✅ Database Reset Successfully!</h1>
            <p>All tables have been dropped and recreated with sample data.</p>
            <a href="/">Go to Home</a> | 
            <a href="/users">View Users</a>
        `);
    });
});

// DELETE Test User (for demonstrating RESET works)
app.get('/delete-test-user', function(req, res) {
    let query1 = "CALL sp_demo_delete_user();";
    
    db.pool.query(query1, function(error, rows, fields) {
        if (error) {
            console.log('Error deleting test user:', error);
            res.status(500).send('Error deleting test user: ' + error.message);
            return;
        }
        
        res.redirect('/users');
    });
});

// ==================== Helper Functions ====================

// helper function for Users.hbs to format date
const handlebars = require('express-handlebars');

const hbs = handlebars.create ({
    helpers: {
        formatDate: function(date) {
            if (!date) return '';
            // Format date as YYYY-MM-DD
            const d = new Date(date);
            return d.toISOString().split('T')[0];
        }
    }
})

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');

/*
    LISTENER
*/
app.listen(PORT, function() {
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.');
});