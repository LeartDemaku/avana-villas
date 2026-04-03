require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
// app.use(express.static(path.join(__dirname, '../'))); // Moved down to allow API priority

// Nodemailer Setup
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: true, // MUST BE TRUE FOR PORT 465
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false // Helps with some windows network issues
    }
});

// Verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.error('--- GABIM SMTP ---');
        console.error('Mesazhi:', error.message);
        console.error('------------------');
    } else {
        console.log('--- SISTEMI I EMAIL-IT GATI (SSL/465) ---');
    }
});

const sendAdminNotification = async (bookingData, bookingId) => {
    console.log(`[DEBUG] Attempting to send email to: ${process.env.ADMIN_EMAIL}`);
    const mailOptions = {
        from: `"AVANA VILLAS" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `Rezervim i Ri: ${bookingData.name} - ID #${bookingId}`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="background-color: #54493D; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">AVANA VILLAS</h1>
                    <p style="color: #C2B4A3; margin: 10px 0 0; font-size: 14px;">Njoftim për Rezervim të Ri</p>
                </div>
                
                <div style="padding: 40px;">
                    <p style="font-size: 16px; margin-bottom: 25px;">Një kërkesë e re për rezervim ka arritur nga uebi:</p>
                    
                    <div style="background-color: #f9f9f7; border-radius: 8px; padding: 25px; margin-bottom: 30px;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px; text-transform: uppercase; width: 40%;">ID e Rezervimit</td><td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">#${bookingId}</td></tr>
                            <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px; text-transform: uppercase;">Klienti</td><td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">${bookingData.name}</td></tr>
                            <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px; text-transform: uppercase;">Telefoni</td><td style="padding: 10px 0; border-bottom: 1px solid #eee;">${bookingData.phone}</td></tr>
                            <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px; text-transform: uppercase;">Email</td><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><a href="mailto:${bookingData.email}" style="color: #54493D; text-decoration: none;">${bookingData.email}</a></td></tr>
                            <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px; text-transform: uppercase;">Vila</td><td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">${bookingData.villaType}</td></tr>
                            <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px; text-transform: uppercase;">Check-in / Out</td><td style="padding: 10px 0; border-bottom: 1px solid #eee;">${bookingData.checkIn} / ${bookingData.checkOut}</td></tr>
                            <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #888; font-size: 13px; text-transform: uppercase;">Mysafirë</td><td style="padding: 10px 0; border-bottom: 1px solid #eee;">${bookingData.guests}</td></tr>
                        </table>
                        
                        <div style="margin-top: 20px;">
                            <p style="color: #888; font-size: 13px; text-transform: uppercase; margin-bottom: 10px;">Mesazhi:</p>
                            <p style="margin: 0; font-style: italic; color: #555;">"${bookingData.message || 'Ska mesazh shtesë'}"</p>
                        </div>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="http://localhost:3000/admin" style="display: inline-block; background-color: #54493D; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">Hap Panelin Admin</a>
                    </div>
                </div>
                
                <div style="background-color: #f4f4f4; padding: 20px; text-align: center; color: #999; font-size: 12px;">
                    © 2026 AVANA VILLAS - Sistemi i Automatizuar i Njoftimeve
                </div>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SUCCESS] Email sent for booking #${bookingId}. Message ID: ${info.messageId}`);
        return info;
    } catch (err) {
        console.error(`[EMAIL ERROR] Failed for booking #${bookingId}:`, err.message);
        throw err;
    }
};

// -----------------------------------------------------------------------------
// AUTHENTICATION & SECURITY
// -----------------------------------------------------------------------------
// Simple Token Logic (In production, use proper JWT/Sessions)
const ADMIN_TOKEN = 'avana-secret-admin-token-2026';

const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token === ADMIN_TOKEN) {
        next();
    } else {
        return res.status(401).json({ error: 'Unauthorized access' });
    }
};

const logAudit = (adminUser, action, details) => {
    const sql = `INSERT INTO audit_logs (adminUser, action, details) VALUES (?, ?, ?)`;
    db.run(sql, [adminUser, action, JSON.stringify(details)], (err) => {
        if (err) console.error('Audit Log Error:', err);
    });
};

// -----------------------------------------------------------------------------
// PUBLIC ROUTES
// -----------------------------------------------------------------------------

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Immediate fallback check for reliability
    if (username === 'admin' && password === 'avana2026') {
        return res.json({ token: ADMIN_TOKEN, user: 'admin' });
    }

    db.get('SELECT * FROM admins WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            res.json({ token: ADMIN_TOKEN, user: row.username });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

// Test Email Endpoint
app.get('/api/test-email', async (req, res) => {
    try {
        console.log('[TEST] Po dërgoj email-in testues te:', process.env.ADMIN_EMAIL);

        const info = await transporter.sendMail({
            from: `"AVANA TEST" <${process.env.SMTP_USER}>`,
            to: process.env.ADMIN_EMAIL,
            subject: 'PROVË - AVANA VILLAS',
            html: '<h3>Sistemi është konfiguruar saktë!</h3><p>Ky është një email automatik për të vëertetuar funksionimin.</p>'
        });

        console.log('[TEST] Email-i u dërgua me sukses! Message ID:', info.messageId);
        res.json({ status: "OK", message: "Shikoni inbox-in tuaj tani!", id: info.messageId });
    } catch (err) {
        console.error('[TEST GABIM]:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Diagnostic Endpoint
app.get('/api/status', (req, res) => {
    res.json({
        server: "ONLINE",
        smtp_user: process.env.SMTP_USER,
        admin_email: process.env.ADMIN_EMAIL,
        port: process.env.SMTP_PORT
    });
});

// Get Availability (Blocked Dates)
app.get('/api/availability', (req, res) => {
    const { villaType } = req.query;
    let sql = `SELECT checkIn, checkOut FROM bookings WHERE status != 'cancelled' AND status != 'deleted'`;
    let params = [];

    if (villaType) {
        sql += ` AND villaType = ?`;
        params.push(villaType);
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows); // Frontend will use these ranges to disable calendar dates
    });
});

// Create Booking (Public) - WITH OVERLAP CHECK
app.post('/api/bookings', (req, res) => {
    const { name, email, phone, checkIn, checkOut, guests, villaType, message } = req.body;

    // 1. Check for overlapping dates
    const checkSql = `
        SELECT id FROM bookings 
        WHERE villaType = ? 
        AND status != 'cancelled' 
        AND status != 'deleted'
        AND (
            (checkIn <= ? AND checkOut >= ?) OR
            (checkIn <= ? AND checkOut >= ?) OR
            (checkIn >= ? AND checkOut <= ?)
        )
    `;
    // Overlap logic: (existing_start <= new_end) and (existing_end >= new_start)
    // Simplified logic above covers partial overlaps
    const checkParams = [villaType, checkOut, checkIn, checkOut, checkIn, checkIn, checkOut];

    db.get(checkSql, checkParams, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            return res.status(409).json({ error: 'Dates are already booked for this villa type.' });
        }

        // 2. Insert if free
        const sql = `INSERT INTO bookings (name, email, phone, checkIn, checkOut, guests, villaType, message, status) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`;
        const params = [name, email, phone, checkIn, checkOut, guests, villaType, message];

        db.run(sql, params, async function (err) {
            if (err) return res.status(500).json({ error: err.message });

            const bookingId = this.lastID;

            try {
                // Try sending email, but don't block the user
                if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('your-email')) {
                    console.warn(`[WARNING] Booking #${bookingId} saved, but SMTP not configured.`);
                } else {
                    await sendAdminNotification(req.body, bookingId);
                    console.log(`[EMAIL SUCCESS] Admin notification sent for Booking #${bookingId}`);
                }

                res.json({ id: bookingId, message: 'Rezervimi u krye me sukses.' });
            } catch (emailErr) {
                console.error(`[EMAIL ERROR] Failed for Booking #${bookingId}:`, emailErr.message);
                // Return success anyway, as the booking is in the database
                res.json({
                    id: bookingId,
                    message: 'Rezervimi u krye, por njoftimi në email dështoi.',
                    error: emailErr.message
                });
            }
        });
    });
});

// Get Prices (Public)
app.get('/api/prices', (req, res) => {
    db.all('SELECT * FROM prices', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// -----------------------------------------------------------------------------
// ADMIN ROUTES (PROTECTED)
// -----------------------------------------------------------------------------

// Get All Bookings (Full Details)
app.get('/api/admin/bookings', authenticateAdmin, (req, res) => {
    // Optionally allow filtering by status/date via query params
    db.all('SELECT * FROM bookings WHERE status != "deleted" ORDER BY createdAt DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Update Booking Status (Soft Cancel / Reactivate)
app.put('/api/admin/bookings/:id/status', authenticateAdmin, (req, res) => {
    const { status } = req.body; // 'confirmed', 'cancelled', 'pending'
    const { id } = req.params;

    db.run('UPDATE bookings SET status = ? WHERE id = ?', [status, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        logAudit('admin', 'UPDATE_STATUS', { bookingId: id, newStatus: status });

        // Mock Cancellation Email
        if (status === 'cancelled') {
            console.log(`[EMAIL] Cancellation Notice sent for Booking #${id}`);
        }

        res.json({ message: 'Status updated' });
    });
});

// DELETE Booking (Permanent)
app.delete('/api/admin/bookings/:id', authenticateAdmin, (req, res) => {
    const { id } = req.params;

    // Actually delete or mark as deeply deleted? 
    // Requirement says "Permanently delete" OR "Soft Cancel". This route handles Permanent Delete.
    // We will use DELETE query for permanent removal.

    db.run('DELETE FROM bookings WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        logAudit('admin', 'DELETE_BOOKING', { bookingId: id });
        console.log(`[EMAIL] Booking #${id} deleted. Dates released.`);

        res.json({ message: 'Booking permanently deleted' });
    });
});

// Update Prices
app.put('/api/prices/:villaType', authenticateAdmin, (req, res) => {
    const { pricePerNight } = req.body;
    const { villaType } = req.params;

    db.run('UPDATE prices SET pricePerNight = ? WHERE villaType = ?', [pricePerNight, villaType], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        logAudit('admin', 'UPDATE_PRICE', { villaType, pricePerNight });
        res.json({ message: 'Price updated successfully' });
    });
});

// Admin Stats
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
    const sql = `
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
        FROM bookings WHERE status != 'deleted'
    `;
    db.get(sql, [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

// Serve static files
app.use(express.static(path.join(__dirname, '../')));

// Serve frontend fallback
app.use((req, res) => {
    // If request accepts html
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, '../index.html'));
        return;
    }
    res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
