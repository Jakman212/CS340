-- ============================================================
-- DDL.sql — Study Application (CS340) — Group 69
-- Sasan Pourassef, Jeremy Dempsey
-- ============================================================

DROP PROCEDURE IF EXISTS sp_load_study_app;

DELIMITER //
CREATE PROCEDURE sp_load_study_app()
BEGIN
    -- Disable FK checks & autocommit while we rebuild the schema
    SET FOREIGN_KEY_CHECKS = 0;
    SET AUTOCOMMIT = 0;

    -- ------------------------------------------------------------
    -- DROP tables in dependency order
    -- ------------------------------------------------------------
    DROP TABLE IF EXISTS Quiz_Flashcards;
    DROP TABLE IF EXISTS User_Quizzes;
    DROP TABLE IF EXISTS User_StudySets;

    DROP TABLE IF EXISTS Quizzes;
    DROP TABLE IF EXISTS Flashcards;
    DROP TABLE IF EXISTS StudySets;
    DROP TABLE IF EXISTS Users;

    -- ------------------------------------------------------------
    -- Users
    -- ------------------------------------------------------------
    CREATE TABLE Users (
      user_id        INT AUTO_INCREMENT PRIMARY KEY,
      username       VARCHAR(50)  NOT NULL UNIQUE,
      email          VARCHAR(100) NOT NULL UNIQUE,
      password_hash  VARCHAR(255) NOT NULL,
      join_date      DATE NOT NULL,
      CONSTRAINT chk_username_len CHECK (CHAR_LENGTH(username) >= 3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- ------------------------------------------------------------
    -- StudySets
    -- A named collection of flashcards grouped by topic/course.
    -- Each set has an owner. 
    -- Sharing to additional users is modeled with User_StudySets.
    -- ------------------------------------------------------------
    CREATE TABLE StudySets (
      set_id      INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT NOT NULL,  -- owner/creator
      title       VARCHAR(100) NOT NULL,
      subject     VARCHAR(50),
      created_at  DATETIME NOT NULL,
      CONSTRAINT fk_studysets_owner
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT uq_owner_title UNIQUE (user_id, title)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- ------------------------------------------------------------
    -- Flashcards
    -- Individual study Q&A
    -- Difficulty options: easy/medium/hard.
    -- ------------------------------------------------------------
    CREATE TABLE Flashcards (
      card_id          INT AUTO_INCREMENT PRIMARY KEY,
      set_id           INT NOT NULL,
      front_text       TEXT NOT NULL,
      back_text        TEXT NOT NULL,
      difficulty_level ENUM('easy','medium','hard') DEFAULT 'easy',
      CONSTRAINT fk_flashcards_set
        FOREIGN KEY (set_id) REFERENCES StudySets(set_id)
        ON UPDATE CASCADE ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- ------------------------------------------------------------
    -- Quizzes
    -- Represents a generated quiz.
    -- A quiz is associated with a user_id.
    -- Additional takers can be modeled with User_Quizzes.
    -- ------------------------------------------------------------
    CREATE TABLE Quizzes (
      quiz_id      INT AUTO_INCREMENT PRIMARY KEY,
      user_id      INT NOT NULL,
      score        DECIMAL(5,2) NULL,
      CONSTRAINT chk_score 
        CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
      attempt_date DATETIME NOT NULL,
      CONSTRAINT fk_quizzes_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- ------------------------------------------------------------
    -- User_StudySets
    -- Allows sharing StudySets with multiple users.
    -- The owner relationship remains in StudySets.user_id.
    -- ------------------------------------------------------------
    CREATE TABLE User_StudySets (
      user_id INT NOT NULL,
      set_id  INT NOT NULL,
      role    ENUM('viewer','editor') DEFAULT 'viewer',
      PRIMARY KEY (user_id, set_id),
      CONSTRAINT fk_us_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT fk_us_set
        FOREIGN KEY (set_id) REFERENCES StudySets(set_id)
        ON UPDATE CASCADE ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- ------------------------------------------------------------
    -- User_Quizzes
    -- Tracks which users have access to or have taken a given quiz.
    -- ------------------------------------------------------------
    CREATE TABLE User_Quizzes (
      user_id INT NOT NULL,
      quiz_id INT NOT NULL,
      PRIMARY KEY (user_id, quiz_id),
      CONSTRAINT fk_uq_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT fk_uq_quiz
        FOREIGN KEY (quiz_id) REFERENCES Quizzes(quiz_id)
        ON UPDATE CASCADE ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- ------------------------------------------------------------
    -- Quiz_Flashcards
    -- Maps which flashcards were included in a quiz
    -- ------------------------------------------------------------
    CREATE TABLE Quiz_Flashcards (
      quiz_id  INT NOT NULL,
      card_id  INT NOT NULL,
      question_order INT,
      PRIMARY KEY (quiz_id, card_id),
      CONSTRAINT fk_qf_quiz
        FOREIGN KEY (quiz_id) REFERENCES Quizzes(quiz_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT fk_qf_card
        FOREIGN KEY (card_id) REFERENCES Flashcards(card_id)
        ON UPDATE CASCADE ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    -- ============================================================
    -- Example Data
    -- *AI used to generate some example data*
    -- ============================================================

    -- Users
    INSERT INTO Users (username, email, password_hash, join_date) VALUES
    ('sasan',   'sasan@example.edu',   'hash_sasan',   '2025-09-01'),
    ('jeremy',  'jeremy@example.edu',  'hash_jeremy',  '2025-09-03'),
    ('john',    'john@example.edu',    'hash_john',    '2025-09-10');

    -- StudySets
    INSERT INTO StudySets (user_id, title, subject, created_at) VALUES
    (1, 'CS340 - SQL Basics',   'Databases', '2025-09-15 09:30:00'),
    (1, 'Biology - Cell Terms', 'Biology',   '2025-09-20 14:00:00'),
    (2, 'Algorithms - Sorting', 'CS',        '2025-09-25 16:45:00');

    -- Flashcards
    INSERT INTO Flashcards (set_id, front_text, back_text, difficulty_level) VALUES
    (1, 'What is a primary key?',       'A column or set of columns that uniquely identify a row.', 'easy'),
    (1, 'Define foreign key.',          'A field referencing a PK in another table; enforces referential integrity.', 'easy'),
    (1, 'What does ON DELETE CASCADE do?', 'Deletes child rows when the parent is deleted.', 'medium'),
    (2, 'Mitochondria function?',       'Powerhouse of the cell; ATP production.', 'easy'),
    (3, 'Average time complexity of merge sort?', 'O(n log n)', 'medium');

    -- Quizzes
    INSERT INTO Quizzes (user_id, score, attempt_date) VALUES
    (1, 95.00, '2025-10-01 10:00:00'),
    (2, 88.50, '2025-10-02 13:20:00');

    -- Sharing StudySets
    INSERT INTO User_StudySets (user_id, set_id, role) VALUES
    (2, 1, 'viewer'),  -- Jeremy can view Sasan's set
    (3, 1, 'editor');  -- John can edit Sasan's set

    -- Users associated with Quizzes
    INSERT INTO User_Quizzes (user_id, quiz_id) VALUES
    (1, 1),
    (2, 1),
    (2, 2);

    -- Quiz_Flashcards mappings
    INSERT INTO Quiz_Flashcards (quiz_id, card_id, question_order) VALUES
    (1, 1, 1),
    (1, 2, 2),
    (1, 3, 3),
    (2, 5, 1);

    -- ============================================================
    -- Commit & Re-enable FK checks
    -- ============================================================
    SET FOREIGN_KEY_CHECKS = 1;
    COMMIT;
END //
DELIMITER ;

-- Use the following statement to reset/load the Study App database:
-- CALL sp_load_study_app();


