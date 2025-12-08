/* ============================================================
   data_manipulation_queries.sql — Study Application Queries (CS340)
   Group 69 — Sasan Pourassef & Jeremy Dempsey
   Oregon State University
--
-- Description:
--   This file contains all handwritten SQL data manipulation
--   queries (CREATE, READ, UPDATE, DELETE) used by the Study
--   Application backend. These queries support full CRUD
--   functionality for all main entities and junction tables.
--
-- Usage:
--   These queries are executed directly by the Node.js backend
--   using prepared statements. No ORM or query generator is used.
-- ============================================================ */


-- USERS ======================================================


-- CREATE:
INSERT INTO Users (username, email, password_hash, join_date)
VALUES (@usernameInput, @emailInput, @passwordHashInput, @joinDateInput);

-- READ (browse):
SELECT user_id, username, email, join_date
FROM Users
ORDER BY join_date DESC, username;

-- READ (single for update form):
SELECT user_id, username, email, password_hash, join_date
FROM Users
WHERE user_id = @user_idInput;

-- UPDATE:
UPDATE Users
SET username = @usernameInput,
    email = @emailInput,
    password_hash = @passwordHashInput
WHERE user_id = @user_idInput;

-- DELETE:
DELETE FROM Users
WHERE user_id = @user_idInput;




-- STUDYSETS ======================================================

-- CREATE:
INSERT INTO StudySets (user_id, title, subject, created_at)
VALUES (@owner_user_idInput, @titleInput, @subjectInput, @createdAtInput);

-- READ (browse with owner username & flashcard count):
SELECT s.set_id,
       s.title,
       s.subject,
       s.created_at,
       s.user_id       AS owner_id,
       u.username      AS owner_username,
       COUNT(f.card_id) AS flashcard_count
FROM StudySets AS s
JOIN Users AS u       ON u.user_id = s.user_id
LEFT JOIN Flashcards f ON f.set_id  = s.set_id
GROUP BY s.set_id, s.title, s.subject, s.created_at, s.user_id, u.username
ORDER BY s.created_at DESC, s.title;

-- READ (single for update form):
SELECT set_id, user_id, title, subject, created_at
FROM StudySets
WHERE set_id = @set_idInput;

-- UPDATE:
UPDATE StudySets
SET user_id   = @owner_user_idInput,
    title     = @titleInput,
    subject   = @subjectInput
WHERE set_id = @set_idInput;

-- DELETE:
DELETE FROM StudySets
WHERE set_id = @set_idInput;



-- FLASHCARDS ======================================================

-- CREATE:
INSERT INTO Flashcards (set_id, front_text, back_text, difficulty_level)
VALUES (@set_idInput, @frontTextInput, @backTextInput, @difficultyLevelInput);

-- READ (by StudySet):
SELECT card_id, set_id, front_text, back_text, difficulty_level
FROM Flashcards
WHERE set_id = @set_idInput
ORDER BY card_id;

-- READ (single for update form):
SELECT card_id, set_id, front_text, back_text, difficulty_level
FROM Flashcards
WHERE card_id = @card_idInput;

-- UPDATE:
UPDATE Flashcards
SET set_id          = @set_idInput,
    front_text      = @frontTextInput,
    back_text       = @backTextInput,
    difficulty_level = @difficultyLevelInput
WHERE card_id = @card_idInput;

-- DELETE:
DELETE FROM Flashcards
WHERE card_id = @card_idInput;




-- QUIZZES ======================================================

-- CREATE:
INSERT INTO Quizzes (user_id, score, attempt_date)
VALUES (@quiz_owner_user_idInput, @scoreInput, @attemptDateInput);

-- READ (browse with owner & number of questions):
SELECT q.quiz_id,
       q.user_id,
       u.username       AS owner_username,
       q.score,
       q.attempt_date,
       COUNT(qf.card_id) AS question_count
FROM Quizzes q
JOIN Users u        ON u.user_id = q.user_id
LEFT JOIN Quiz_Flashcards qf ON qf.quiz_id = q.quiz_id
GROUP BY q.quiz_id, q.user_id, u.username, q.score, q.attempt_date
ORDER BY q.attempt_date DESC, q.quiz_id;

-- READ (single for update form):
SELECT quiz_id, user_id, score, attempt_date
FROM Quizzes
WHERE quiz_id = @quiz_idInput;

-- UPDATE:
UPDATE Quizzes
SET user_id      = @quiz_owner_user_idInput,
    score        = @scoreInput
WHERE quiz_id = @quiz_idInput;

-- DELETE:
DELETE FROM Quizzes
WHERE quiz_id = @quiz_idInput;



-- USER_STUDYSETS  (junction: sharing StudySets with users) =============

-- CREATE (share a set with a user):
INSERT INTO User_StudySets (user_id, set_id, role)
VALUES (@user_idInput, @set_idInput, @roleInput);  -- role ∈ {'viewer','editor'}

-- READ (who has access to a set):
SELECT us.user_id, u.username, us.set_id, us.role
FROM User_StudySets us
JOIN Users u ON u.user_id = us.user_id
WHERE us.set_id = @set_idInput
ORDER BY u.username;

-- UPDATE (change role):
UPDATE User_StudySets
SET role = @roleInput
WHERE user_id = @user_idInput
  AND set_id  = @set_idInput;

-- DELETE (remove share):
DELETE FROM User_StudySets
WHERE user_id = @user_idInput
  AND set_id  = @set_idInput;



-- USER_QUIZZES  (junction: users associated with quizzes) =============

-- CREATE (associate a user with a quiz):
INSERT INTO User_Quizzes (user_id, quiz_id)
VALUES (@user_idInput, @quiz_idInput);

-- READ (list users on a quiz):
SELECT uq.user_id, u.username, uq.quiz_id
FROM User_Quizzes uq
JOIN Users u ON u.user_id = uq.user_id
WHERE uq.quiz_id = @quiz_idInput
ORDER BY u.username;

-- DELETE (remove user from quiz):
DELETE FROM User_Quizzes
WHERE user_id = @user_idInput
  AND quiz_id = @quiz_idInput;



-- QUIZ_FLASHCARDS  (junction: flashcards included in a quiz) =============

-- CREATE (add a flashcard to a quiz with order):
INSERT INTO Quiz_Flashcards (quiz_id, card_id, question_order)
VALUES (@quiz_idInput, @card_idInput, @questionOrderInput);

-- READ (list flashcards in a quiz with text & difficulty):
SELECT qf.quiz_id,
       qf.card_id,
       qf.question_order,
       f.front_text,
       f.back_text,
       f.difficulty_level
FROM Quiz_Flashcards qf
JOIN Flashcards f ON f.card_id = qf.card_id
WHERE qf.quiz_id = @quiz_idInput
ORDER BY qf.question_order, qf.card_id;

-- UPDATE (change order of a flashcard in a quiz):
UPDATE Quiz_Flashcards
SET question_order = @questionOrderInput
WHERE quiz_id = @quiz_idInput
  AND card_id = @card_idInput;

-- DELETE (remove one flashcard from a quiz):
DELETE FROM Quiz_Flashcards
WHERE quiz_id = @quiz_idInput
  AND card_id = @card_idInput;


