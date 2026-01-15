CREATE TABLE
    IF NOT EXISTS vectors (
        key TEXT NOT NULL,
        id INTEGER NOT NULL,
        vector BLOB NOT NULL,
        PRIMARY KEY (key, id)
    );
