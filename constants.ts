import { Role, User, Student, ClassFeeConfig } from './types';

export const USERS: User[] = [
  { id: 'user-01', username: 'admin', password: 'password', name: 'Dr. Evelyn Reed', role: Role.Admin },
  { id: 'user-02', username: 'accountant', password: 'password', name: 'Marcus Thorne', role: Role.Accountant },
  { id: 'user-03', username: 'teacher', password: 'password', name: 'Lena Petrova', role: Role.Teacher },
  { id: 'user-04', username: 'parent', password: 'password', name: 'Raj Patel', role: Role.Parent },
];

export const ACADEMIC_YEAR = "2025-26";

export const INITIAL_CLASS_FEES: ClassFeeConfig[] = [
    { class_name: 'LKG', fee_structure: { [ACADEMIC_YEAR]: 15000 } },
    { class_name: 'UKG', fee_structure: { [ACADEMIC_YEAR]: 16000 } },
    { class_name: '1', fee_structure: { [ACADEMIC_YEAR]: 18000 } },
    { class_name: '2', fee_structure: { [ACADEMIC_YEAR]: 19000 } },
    { class_name: '3', fee_structure: { [ACADEMIC_YEAR]: 20000 } },
    { class_name: '4', fee_structure: { [ACADEMIC_YEAR]: 21000 } },
    { class_name: '5', fee_structure: { [ACADEMIC_YEAR]: 22000 } },
    { class_name: '6', fee_structure: { [ACADEMIC_YEAR]: 24000 } },
    { class_name: '7', fee_structure: { [ACADEMIC_YEAR]: 26000 } },
    { class_name: '8', fee_structure: { [ACADEMIC_YEAR]: 28000 } },
    { class_name: '9', fee_structure: { [ACADEMIC_YEAR]: 30000 } },
    { class_name: '10', fee_structure: { [ACADEMIC_YEAR]: 32000 } },
];

export const INITIAL_STUDENTS: Student[] = [
    {
        admission_number: 'S001',
        student_name: 'Aarav Sharma',
        father_name: 'Manish Sharma',
        mother_name: 'Priya Sharma',
        dob: '2015-05-20',
        sessions: [{ session: '2025-26', class: '5' }],
        previous_pending: [
            { year: '2023-24', amount: 2000 },
            { year: '2024-25', amount: 1500 }
        ],
        current_year_fees: 22000,
        payments: [
            {
                id: 'P001', date: '2025-04-10', amount: 10000, mode: 'UPI', 
                applied_to: [{ year: '2025-26', amount: 10000 }], 
                receipt_no: 'R001', recorded_by: { id: 'user-02', name: 'Marcus Thorne' }
            }
        ],
        notes: 'Enrolled in chess club.'
    },
    {
        admission_number: 'S002',
        student_name: 'Diya Patel',
        father_name: 'Sanjay Patel',
        mother_name: 'Anita Patel',
        dob: '2018-02-15',
        sessions: [{ session: '2025-26', class: '2' }],
        previous_pending: [],
        current_year_fees: 19000,
        payments: [],
    },
    {
        admission_number: 'S003',
        student_name: 'Rohan Singh',
        father_name: 'Vikram Singh',
        mother_name: 'Sunita Singh',
        dob: '2012-11-30',
        sessions: [{ session: '2025-26', class: '8' }],
        previous_pending: [
            { year: '2024-25', amount: 5000 }
        ],
        current_year_fees: 28000,
        payments: [],
    },
];

export const ALL_CLASSES = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];