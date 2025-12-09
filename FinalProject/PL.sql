-- ============================================================
-- PL.sql — Study Application Stored Procedures (CS340)
-- Group 69 — Sasan Pourassef & Jeremy Dempsey
-- Oregon State University
--
-- Description:
--   This file contains all stored procedures (PL/SQL / MySQL)
--   used by the Study Application project. At this stage, it
--   includes:
--     • sp_reset_study_app   → Full database reset + reseed
--     • sp_demo_delete_user → Single CUD demo for RESET testing
--
-- Purpose:
--   These procedures allow graders and reviewers to:
--     1) Modify the database using a controlled CUD operation
--     2) Restore the database to a known clean state
--        using CALL sp_reset_study_app();
--
-- Use of AI Tools (if applicable):
--   Portions of this stored procedure file were developed
--   with the assistance of AI-based code generation tools
--   and reviewed/edited by the authors in accordance with
--   CS340 course policy.
-- ============================================================

DROP PROCEDURE IF EXISTS sp_reset_study_app;
DROP PROCEDURE IF EXISTS sp_demo_delete_user;
DROP PROCEDURE IF EXISTS sp_create_user;
DROP PROCEDURE IF EXISTS sp_update_user;
DROP PROCEDURE IF EXISTS sp_delete_user;

/* -------------------------------------------------------------
    Hard reset DB to a minimal, deterministic seed so
    reviewers can browse pages with real rows.

     1) Temporarily disable FK checks
     2) DELETE all rows (junctions first, then children, then parents)
     3) Re-seed minimal demo data that matches UI pages

     Sources:
       Our original work, adapted from course examples.
   ------------------------------------------------------------- */
DELIMITER //
CREATE PROCEDURE sp_reset_study_app()
BEGIN
  /* Disable foreign key checks so deletes are simple */
  SET @old_fk = @@FOREIGN_KEY_CHECKS;
  SET FOREIGN_KEY_CHECKS = 0;

  /* Junctions first (M:N) */
  DELETE FROM Quiz_Flashcards;
  DELETE FROM User_Quizzes;
  DELETE FROM User_StudySets;

  /* Children */
  DELETE FROM Flashcards;
  DELETE FROM Quizzes;
  DELETE FROM StudySets;

  /* Parents */
  DELETE FROM Users;

  /* Re-enable FK checks */
  SET FOREIGN_KEY_CHECKS = @old_fk;

  /* ---------------------------------------------------------
     Seed data (AUTO_INCREMENT will start at 1 on fresh dbs;
     even if not, this still yields usable demo rows).

     Sources:
      AI was used to help generate sample data
     --------------------------------------------------------- */

  /* Users */
  INSERT INTO Users (username, email, password_hash, join_date)
  VALUES
    ('ResetDemo', 'reset.demo@example.com', '***demo-hash***', CURDATE()),
    ('Alice',     'alice@example.com',      '***hash***',       DATE_SUB(CURDATE(), INTERVAL 10 DAY)),
    ('Bob',       'bob@example.com',        '***hash***',       DATE_SUB(CURDATE(), INTERVAL 30 DAY));

  /* StudySets: owned by ResetDemo (user_id ≈ 1) and Alice (user_id ≈ 2) */
  INSERT INTO StudySets (user_id, title, subject, created_at)
  VALUES
    ((SELECT user_id FROM Users WHERE username='ResetDemo' LIMIT 1), 'SQL Basics',  'Databases', NOW()),
    ((SELECT user_id FROM Users WHERE username='Alice'     LIMIT 1), 'Biology 101', 'Biology',   NOW());

  /* Flashcards: tie to existing sets */
  INSERT INTO Flashcards (set_id, front_text, back_text, difficulty_level)
  VALUES
    ((SELECT set_id FROM StudySets WHERE title='SQL Basics'  LIMIT 1), 'What does SELECT do?', 'Reads rows from a table', 'easy'),
    ((SELECT set_id FROM StudySets WHERE title='SQL Basics'  LIMIT 1), 'What is a FK?',        'Ref to a PK in another table', 'medium'),
    ((SELECT set_id FROM StudySets WHERE title='Biology 101' LIMIT 1), 'Cell organelle?',      'Mitochondria', 'easy');

  /* Quizzes: owned by ResetDemo and Alice */
  INSERT INTO Quizzes (user_id, score, attempt_date)
  VALUES
    ((SELECT user_id FROM Users WHERE username='ResetDemo' LIMIT 1), 95.0, NOW()),
    ((SELECT user_id FROM Users WHERE username='Alice'     LIMIT 1), 88.5, DATE_SUB(NOW(), INTERVAL 1 DAY));

  /* Junctions (minimal demo links) */
  -- User_StudySets: share SQL Basics with Bob
  INSERT INTO User_StudySets (user_id, set_id, role)
  VALUES (
    (SELECT user_id FROM Users     WHERE username='Bob'        LIMIT 1),
    (SELECT set_id  FROM StudySets WHERE title='SQL Basics'    LIMIT 1),
    'viewer'
  );

  -- User_Quizzes: associate Bob to Alice's quiz
  INSERT INTO User_Quizzes (user_id, quiz_id)
  VALUES (
    (SELECT user_id FROM Users  WHERE username='Bob' LIMIT 1),
    (SELECT quiz_id  FROM Quizzes q
       JOIN Users u ON u.user_id = q.user_id
     WHERE u.username='Alice'
     ORDER BY q.quiz_id DESC LIMIT 1)     
  );

  -- Quiz_Flashcards: attach two SQL cards to ResetDemo’s quiz
  INSERT INTO Quiz_Flashcards (quiz_id, card_id, question_order)
  SELECT
    (SELECT quiz_id FROM Quizzes q
       JOIN Users u ON u.user_id=q.user_id
     WHERE u.username='ResetDemo'
     ORDER BY quiz_id DESC LIMIT 1) AS quiz_id,
    c.card_id,
    ROW_NUMBER() OVER (ORDER BY c.card_id) AS question_order
  FROM Flashcards c
  JOIN StudySets s ON s.set_id=c.set_id
  WHERE s.title='SQL Basics'
  ORDER BY c.card_id
  LIMIT 2;
END //
DELIMITER ;

-- -------------------------------------------------------------
-- Simple CUD demo to prove RESET works.
-- Deletes the 'ResetDemo' user;

-- How to test:
--   1) CALL sp_demo_delete_user();  -- user disappears
--   2) CALL sp_reset_study_app();   -- user & seed return

-- Sources:
--   Our original work, adapted from course examples.
-- -------------------------------------------------------------
DELIMITER //
CREATE PROCEDURE sp_demo_delete_user()
BEGIN
  DELETE FROM Users WHERE username = 'ResetDemo';
END //
DELIMITER ;

-- ============================================================
-- Added additional stored procedures to meet Step 6 requirements
-- ============================================================

-- ============================================================
-- sp_create_user: Insert a new user into Users table
-- Used by: POST /users/create route in app.js
-- Sources: Our original work
-- ============================================================
DELIMITER //
CREATE PROCEDURE sp_create_user(
  IN p_username VARCHAR(50),
  IN p_email VARCHAR(100),
  IN p_password_hash VARCHAR(255),
  IN p_join_date DATE
)
BEGIN
  INSERT INTO Users (username, email, password_hash, join_date)
  VALUES (p_username, p_email, p_password_hash, p_join_date);
  
  SELECT LAST_INSERT_ID() AS user_id;
END //
DELIMITER ;

-- ============================================================
-- sp_update_user: Update an existing user in Users table
-- Used by: POST /users/update route in app.js
-- Sources: Our original work
-- ============================================================
DELIMITER //
CREATE PROCEDURE sp_update_user(
  IN p_user_id INT,
  IN p_username VARCHAR(50),
  IN p_email VARCHAR(100),
  IN p_password_hash VARCHAR(255)
)
BEGIN
  UPDATE Users
  SET username = p_username,
      email = p_email,
      password_hash = p_password_hash
  WHERE user_id = p_user_id;
END //
DELIMITER ;

-- ============================================================
-- sp_delete_user: Delete a user from Users table
-- Used by: POST /users/delete route in app.js
-- Sources: Our original work
-- ============================================================
DELIMITER //
CREATE PROCEDURE sp_delete_user(
  IN p_user_id INT
)
BEGIN
  DELETE FROM Users WHERE user_id = p_user_id;
END //
DELIMITER ;
