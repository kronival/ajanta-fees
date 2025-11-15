
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Setup
const connectionString = 'postgresql://neondb_owner:npg_a1HfmYv2QLIC@ep-billowing-term-aezagv1p-pooler.c-2.us-east-2.aws.neon.tech/school_db?sslmode=require';

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

// Initial Data for Seeding
const ACADEMIC_YEAR = "2025-26";
const INITIAL_USERS = [
    { id: 'user-01', username: 'admin', password: 'password', name: 'Dr. Evelyn Reed', role: 'Admin' },
    { id: 'user-02', username: 'accountant', password: 'password', name: 'Marcus Thorne', role: 'Accountant' },
    { id: 'user-03', username: 'teacher', password: 'password', name: 'Lena Petrova', role: 'Teacher' },
    { id: 'user-04', username: 'parent', password: 'password', name: 'Raj Patel', role: 'Parent' },
];

const INITIAL_CLASS_FEES = [
    { class_name: 'LKG', fee_structure: JSON.stringify({ [ACADEMIC_YEAR]: 15000 }) },
    { class_name: 'UKG', fee_structure: JSON.stringify({ [ACADEMIC_YEAR]: 16000 }) },
    { class_name: '1', fee_structure: JSON.stringify({ [ACADEMIC_YEAR]: 18000 }) },
    { class_name: '2', fee_structure: JSON.stringify({ [ACADEMIC_YEAR]: 19000 }) },
    { class_name: '3', fee_structure: JSON.stringify({ [ACADEMIC_YEAR]: 20000 }) },
    { class_name: '4', fee_structure: JSON.stringify({ [ACADEMIC_YEAR]: 21000 }) },
    { class_name: '5', fee_structure: JSON.stringify({ [ACADEMIC_YEAR]: 22000 }) },
    { class_name: '6', fee_structure: JSON.stringify({ [ACADEMIC_YEAR]: 24000 }) },
    { class_name: '7', fee_structure: JSON.stringify({ [ACADEMIC_YEAR]: 26000 }) },
    { class_name: '8', fee_structure: JSON.stringify({ [ACADEMIC_YEAR]: 28000 }) },
    { class_name: '9', fee_structure: JSON.stringify({ [ACADEMIC_YEAR]: 30000 }) },
    { class_name: '10', fee_structure: JSON.stringify({ [ACADEMIC_YEAR]: 32000 }) },
];

const INITIAL_STUDENTS = [
    {
        admission_number: 'S001',
        student_name: 'Aarav Sharma',
        father_name: 'Manish Sharma',
        mother_name: 'Priya Sharma',
        dob: '2015-05-20',
        sessions: JSON.stringify([{ session: '2025-26', class: '5' }]),
        previous_pending: JSON.stringify([
            { year: '2023-24', amount: 2000 },
            { year: '2024-25', amount: 1500 }
        ]),
        current_year_fees: 22000,
        notes: 'Enrolled in chess club.'
    },
    {
        admission_number: 'S002',
        student_name: 'Diya Patel',
        father_name: 'Sanjay Patel',
        mother_name: 'Anita Patel',
        dob: '2018-02-15',
        sessions: JSON.stringify([{ session: '2025-26', class: '2' }]),
        previous_pending: JSON.stringify([]),
        current_year_fees: 19000,
        notes: ''
    },
    {
        admission_number: 'S003',
        student_name: 'Rohan Singh',
        father_name: 'Vikram Singh',
        mother_name: 'Sunita Singh',
        dob: '2012-11-30',
        sessions: JSON.stringify([{ session: '2025-26', class: '8' }]),
        previous_pending: JSON.stringify([
            { year: '2024-25', amount: 5000 }
        ]),
        current_year_fees: 28000,
        notes: ''
    },
];

const INITIAL_PAYMENTS = [
    {
        id: 'P001',
        student_admission_number: 'S001',
        date: '2025-04-10',
        amount: 10000,
        mode: 'UPI',
        applied_to: JSON.stringify([{ year: '2025-26', amount: 10000 }]),
        receipt_no: 'R001',
        recorded_by: JSON.stringify({ id: 'user-02', name: 'Marcus Thorne' })
    }
];

async function initDb() {
    try {
        const client = await pool.connect();
        try {
            // Users Table
            await client.query(`CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE,
                password TEXT,
                name TEXT,
                role TEXT
            )`);

            // Class Fees Table
            await client.query(`CREATE TABLE IF NOT EXISTS class_fees (
                class_name TEXT PRIMARY KEY,
                fee_structure TEXT
            )`);

            // Students Table
            await client.query(`CREATE TABLE IF NOT EXISTS students (
                admission_number TEXT PRIMARY KEY,
                student_name TEXT,
                father_name TEXT,
                mother_name TEXT,
                dob TEXT,
                sessions TEXT,
                previous_pending TEXT,
                current_year_fees INTEGER,
                notes TEXT
            )`);

            // Payments Table
            await client.query(`CREATE TABLE IF NOT EXISTS payments (
                id TEXT PRIMARY KEY,
                student_admission_number TEXT,
                date TEXT,
                amount INTEGER,
                mode TEXT,
                applied_to TEXT,
                receipt_no TEXT,
                recorded_by TEXT,
                FOREIGN KEY(student_admission_number) REFERENCES students(admission_number)
            )`);

            // Seed Data if empty
            const { rows } = await client.query("SELECT count(*) as count FROM users");
            if (parseInt(rows[0].count) === 0) {
                console.log("Seeding Database...");
                
                for (const u of INITIAL_USERS) {
                    await client.query("INSERT INTO users (id, username, password, name, role) VALUES ($1, $2, $3, $4, $5)", [u.id, u.username, u.password, u.name, u.role]);
                }

                for (const f of INITIAL_CLASS_FEES) {
                    await client.query("INSERT INTO class_fees (class_name, fee_structure) VALUES ($1, $2)", [f.class_name, f.fee_structure]);
                }

                for (const s of INITIAL_STUDENTS) {
                    await client.query("INSERT INTO students (admission_number, student_name, father_name, mother_name, dob, sessions, previous_pending, current_year_fees, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)", 
                        [s.admission_number, s.student_name, s.father_name, s.mother_name, s.dob, s.sessions, s.previous_pending, s.current_year_fees, s.notes]);
                }

                for (const p of INITIAL_PAYMENTS) {
                    await client.query("INSERT INTO payments (id, student_admission_number, date, amount, mode, applied_to, receipt_no, recorded_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", 
                        [p.id, p.student_admission_number, p.date, p.amount, p.mode, p.applied_to, p.receipt_no, p.recorded_by]);
                }
            }
        } finally {
            client.release();
        }
        console.log('Connected to Neon Postgres database and initialized.');
    } catch (err) {
        console.error("Error initializing DB:", err);
    }
}

initDb();

// --- API Routes ---

// Get All Users
app.get('/api/users', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM users");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add User
app.post('/api/users', async (req, res) => {
    const { id, username, password, name, role } = req.body;
    try {
        await pool.query("INSERT INTO users (id, username, password, name, role) VALUES ($1, $2, $3, $4, $5)", [id, username, password, name, role]);
        res.json({ id, username, name, role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update User
app.put('/api/users/:id', async (req, res) => {
    const { username, password, name, role } = req.body;
    try {
        await pool.query("UPDATE users SET username = $1, password = $2, name = $3, role = $4 WHERE id = $5", [username, password, name, role, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete User
app.delete('/api/users/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Class Fees
app.get('/api/class-fees', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM class_fees");
        const parsed = rows.map(r => ({
            class_name: r.class_name,
            fee_structure: JSON.parse(r.fee_structure)
        }));
        res.json(parsed);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Class Fee
app.put('/api/class-fees/:className', async (req, res) => {
    const { fee_structure, session, newAmount } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query("UPDATE class_fees SET fee_structure = $1 WHERE class_name = $2", [JSON.stringify(fee_structure), req.params.className]);
        
        // Update students current_year_fees
        const { rows: students } = await client.query("SELECT * FROM students");
        for (const student of students) {
             const sessions = JSON.parse(student.sessions);
             const currentSession = sessions.find(s => s.session === session && s.class === req.params.className);
             if (currentSession) {
                 await client.query("UPDATE students SET current_year_fees = $1 WHERE admission_number = $2", [newAmount, student.admission_number]);
             }
        }
        
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Get All Students (with Payments)
app.get('/api/students', async (req, res) => {
    const sql = `
        SELECT 
            s.*,
            json_agg(
                json_build_object(
                    'id', p.id, 
                    'date', p.date, 
                    'amount', p.amount, 
                    'mode', p.mode, 
                    'applied_to', p.applied_to, 
                    'receipt_no', p.receipt_no, 
                    'recorded_by', p.recorded_by
                )
            ) as payments
        FROM students s
        LEFT JOIN payments p ON s.admission_number = p.student_admission_number
        GROUP BY s.admission_number
    `;

    try {
        const { rows } = await pool.query(sql);
        const formatted = rows.map(row => {
            let payments = row.payments; // pg parses JSON automatically
            
            // Handle if payments is null or has null id elements (LEFT JOIN empty behavior in some aggregations)
            if (!payments || (payments.length === 1 && payments[0].id === null)) {
                payments = [];
            } else {
                payments = payments.map(p => ({
                    ...p,
                    // applied_to and recorded_by are stored as TEXT, so they come back as strings inside the JSON object
                    applied_to: typeof p.applied_to === 'string' ? JSON.parse(p.applied_to) : p.applied_to,
                    recorded_by: typeof p.recorded_by === 'string' ? JSON.parse(p.recorded_by) : p.recorded_by
                }));
            }

            return {
                ...row,
                sessions: JSON.parse(row.sessions),
                previous_pending: JSON.parse(row.previous_pending),
                payments: payments
            };
        });
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Student
app.post('/api/students', async (req, res) => {
    const s = req.body;
    try {
        await pool.query(
            "INSERT INTO students (admission_number, student_name, father_name, mother_name, dob, sessions, previous_pending, current_year_fees, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
            [
                s.admission_number, 
                s.student_name, 
                s.father_name, 
                s.mother_name, 
                s.dob, 
                JSON.stringify(s.sessions), 
                JSON.stringify(s.previous_pending), 
                s.current_year_fees, 
                s.notes
            ]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Student
app.put('/api/students/:id', async (req, res) => {
    const s = req.body;
    try {
        await pool.query(
            `UPDATE students SET 
            student_name = $1, father_name = $2, mother_name = $3, dob = $4, 
            sessions = $5, previous_pending = $6, current_year_fees = $7, notes = $8
            WHERE admission_number = $9`,
            [
                s.student_name, 
                s.father_name, 
                s.mother_name, 
                s.dob, 
                JSON.stringify(s.sessions), 
                JSON.stringify(s.previous_pending), 
                s.current_year_fees, 
                s.notes,
                req.params.id
            ]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Student
app.delete('/api/students/:id', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query("DELETE FROM payments WHERE student_admission_number = $1", [req.params.id]);
        await client.query("DELETE FROM students WHERE admission_number = $1", [req.params.id]);
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Add Payment
app.post('/api/payments', async (req, res) => {
    const { admissionNumber, payment } = req.body;
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // 1. Insert Payment
        await client.query(
            "INSERT INTO payments (id, student_admission_number, date, amount, mode, applied_to, receipt_no, recorded_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            [
                payment.id,
                admissionNumber,
                payment.date,
                payment.amount,
                payment.mode,
                JSON.stringify(payment.applied_to),
                payment.receipt_no,
                JSON.stringify(payment.recorded_by)
            ]
        );

        // 2. Update Student Pending Fees
        const { rows } = await client.query("SELECT previous_pending FROM students WHERE admission_number = $1", [admissionNumber]);
        if (rows.length > 0) {
            let pending = JSON.parse(rows[0].previous_pending);
            payment.applied_to.forEach(alloc => {
                const pIndex = pending.findIndex(p => p.year === alloc.year);
                if (pIndex !== -1) {
                    pending[pIndex].amount -= alloc.amount;
                }
            });
            // Filter out fully paid records (floating point safety)
            pending = pending.filter(p => p.amount > 0.01);
            
            await client.query("UPDATE students SET previous_pending = $1 WHERE admission_number = $2", [JSON.stringify(pending), admissionNumber]);
        }
        
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
