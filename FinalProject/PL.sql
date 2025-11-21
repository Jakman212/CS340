/* ============================================================
   Study App — PL.SQL File (CS340)
   Sasan Pourassef & Jeremy Dempsey
   ============================================================ */

DROP PROCEDURE IF EXISTS sp_reset_study_app;
DROP PROCEDURE IF EXISTS sp_demo_delete_user;

/* -------------------------------------------------------------
    Hard reset DB to a minimal, deterministic seed so
    reviewers can browse pages with real rows.

     1) Temporarily disable FK checks
     2) DELETE all rows (junctions first, then children, then parents)
     3) Re-seed minimal demo data that matches UI pages
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
  INSERT INTO User_Quizzes (user_id, quiz_id, score, taken_at)
  VALUES (
    (SELECT user_id FROM Users  WHERE username='Bob' LIMIT 1),
    (SELECT quiz_id  FROM Quizzes q
       JOIN Users u ON u.user_id = q.user_id
     WHERE u.username='Alice'
     ORDER BY q.quiz_id DESC LIMIT 1),
    -- dummy score
    85.0,          
    -- taken_at timestamp
    NOW()          
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
-- -------------------------------------------------------------
DELIMITER //
CREATE PROCEDURE sp_demo_delete_user()
BEGIN
  DELETE FROM Users WHERE username = 'ResetDemo';
END //
DELIMITER ;