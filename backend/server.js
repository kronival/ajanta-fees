
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Setup
const dbPath = path.resolve(__dirname, 'school.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initDb();
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

function initDb() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT,
            name TEXT,
            role TEXT
        )`);

        // Class Fees Table
        db.run(`CREATE TABLE IF NOT EXISTS class_fees (
            class_name TEXT PRIMARY KEY,
            fee_structure TEXT
        )`);

        // Students Table
        db.run(`CREATE TABLE IF NOT EXISTS students (
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
        db.run(`CREATE TABLE IF NOT EXISTS payments (
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
        db.get("SELECT count(*) as count FROM users", [], (err, row) => {
            if (row.count === 0) {
                console.log("Seeding Database...");
                const stmtUser = db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?)");
                INITIAL_USERS.forEach(u => stmtUser.run(u.id, u.username, u.password, u.name, u.role));
                stmtUser.finalize();

                const stmtFee = db.prepare("INSERT INTO class_fees VALUES (?, ?)");
                INITIAL_CLASS_FEES.forEach(f => stmtFee.run(f.class_name, f.fee_structure));
                stmtFee.finalize();

                const stmtStudent = db.prepare("INSERT INTO students VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                INITIAL_STUDENTS.forEach(s => stmtStudent.run(s.admission_number, s.student_name, s.father_name, s.mother_name, s.dob, s.sessions, s.previous_pending, s.current_year_fees, s.notes));
                stmtStudent.finalize();

                const stmtPayment = db.prepare("INSERT INTO payments VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                INITIAL_PAYMENTS.forEach(p => stmtPayment.run(p.id, p.student_admission_number, p.date, p.amount, p.mode, p.applied_to, p.receipt_no, p.recorded_by));
                stmtPayment.finalize();
            }
        });
    });
}

// --- API Routes ---

// Get All Users
app.get('/api/users', (req, res) => {
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add User
app.post('/api/users', (req, res) => {
    const { id, username, password, name, role } = req.body;
    db.run("INSERT INTO users VALUES (?, ?, ?, ?, ?)", [id, username, password, name, role], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id, username, name, role });
    });
});

// Update User
app.put('/api/users/:id', (req, res) => {
    const { username, password, name, role } = req.body;
    db.run("UPDATE users SET username = ?, password = ?, name = ?, role = ? WHERE id = ?", [username, password, name, role, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Delete User
app.delete('/api/users/:id', (req, res) => {
    db.run("DELETE FROM users WHERE id = ?", req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Get Class Fees
app.get('/api/class-fees', (req, res) => {
    db.all("SELECT * FROM class_fees", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const parsed = rows.map(r => ({
            class_name: r.class_name,
            fee_structure: JSON.parse(r.fee_structure)
        }));
        res.json(parsed);
    });
});

// Update Class Fee
app.put('/api/class-fees/:className', (req, res) => {
    const { fee_structure, session, newAmount } = req.body;
    db.run("UPDATE class_fees SET fee_structure = ? WHERE class_name = ?", [JSON.stringify(fee_structure), req.params.className], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Also update current_year_fees for students in this class/session
        db.all("SELECT * FROM students", [], (err, students) => {
            if(!err && students) {
                 students.forEach(student => {
                     const sessions = JSON.parse(student.sessions);
                     const currentSession = sessions.find(s => s.session === session && s.class === req.params.className);
                     if (currentSession) {
                         db.run("UPDATE students SET current_year_fees = ? WHERE admission_number = ?", [newAmount, student.admission_number]);
                     }
                 });
            }
        });

        res.json({ success: true });
    });
});

// Get All Students (with Payments)
app.get('/api/students', (req, res) => {
    const sql = `
        SELECT 
            s.*,
            json_group_array(
                json_object(
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

    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const formatted = rows.map(row => {
            let payments = JSON.parse(row.payments);
            // Handle SQLite behavior where LEFT JOIN returns [null] if no match
            if (payments.length === 1 && payments[0].id === null) {
                payments = [];
            } else {
                payments = payments.map(p => ({
                    ...p,
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
    });
});

// Add Student
app.post('/api/students', (req, res) => {
    const s = req.body;
    db.run(
        "INSERT INTO students VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
        ],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// Update Student
app.put('/api/students/:id', (req, res) => {
    const s = req.body;
    db.run(
        `UPDATE students SET 
            student_name = ?, father_name = ?, mother_name = ?, dob = ?, 
            sessions = ?, previous_pending = ?, current_year_fees = ?, notes = ?
            WHERE admission_number = ?`,
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
        ],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// Delete Student
app.delete('/api/students/:id', (req, res) => {
    db.run("DELETE FROM students WHERE admission_number = ?", req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        // Also delete payments
        db.run("DELETE FROM payments WHERE student_admission_number = ?", req.params.id);
        res.json({ success: true });
    });
});

// Add Payment
app.post('/api/payments', (req, res) => {
    const { admissionNumber, payment } = req.body;
    
    db.serialize(() => {
        // 1. Insert Payment
        db.run(
            "INSERT INTO payments VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
                payment.id,
                admissionNumber,
                payment.date,
                payment.amount,
                payment.mode,
                JSON.stringify(payment.applied_to),
                payment.receipt_no,
                JSON.stringify(payment.recorded_by)
            ],
            (err) => {
                if (err) console.error(err);
            }
        );

        // 2. Update Student Pending Fees
        db.get("SELECT previous_pending FROM students WHERE admission_number = ?", [admissionNumber], (err, row) => {
            if (!err && row) {
                let pending = JSON.parse(row.previous_pending);
                payment.applied_to.forEach(alloc => {
                    const pIndex = pending.findIndex(p => p.year === alloc.year);
                    if (pIndex !== -1) {
                        pending[pIndex].amount -= alloc.amount;
                    }
                });
                // Filter out fully paid records
                pending = pending.filter(p => p.amount > 0.01);
                
                db.run("UPDATE students SET previous_pending = ? WHERE admission_number = ?", [JSON.stringify(pending), admissionNumber]);
            }
        });
        
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
