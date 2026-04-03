const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'avana.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database.');
        createTables();
    }
});

function createTables() {
    // Bookings Table
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        checkIn TEXT NOT NULL,
        checkOut TEXT NOT NULL,
        guests INTEGER NOT NULL,
        villaType TEXT NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Prices Table
    db.run(`CREATE TABLE IF NOT EXISTS prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        villaType TEXT UNIQUE NOT NULL,
        pricePerNight REAL NOT NULL
    )`, () => {
        // Initial Seed
        db.run(`INSERT OR IGNORE INTO prices (villaType, pricePerNight) VALUES ('Standard', 135)`);
        db.run(`INSERT OR IGNORE INTO prices (villaType, pricePerNight) VALUES ('Premium', 180)`);
    });

    // Admin Users (Simple auth for this demo)
    db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )`, () => {
        db.run(`INSERT OR IGNORE INTO admins (username, password) VALUES ('admin', 'avana2026')`);
    });

    // Audit Logs
    db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        adminUser TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
}

module.exports = db;
