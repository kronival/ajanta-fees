export enum Role {
  Admin = 'Admin',
  Accountant = 'Accountant',
  Teacher = 'Teacher',
  Parent = 'Parent',
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: Role;
}

export interface PendingFee {
  year: string;
  amount: number;
}

export interface PaymentAllocation {
  year: string; // "2025-26" for current year
  amount: number;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  mode: 'Cash' | 'Cheque' | 'UPI' | 'Card';
  applied_to: PaymentAllocation[];
  receipt_no: string;
  recorded_by: { id: string, name: string };
}

export interface StudentSession {
  session: string;
  class: string;
}

export interface Student {
  admission_number: string;
  student_name: string;
  father_name: string;
  mother_name: string;
  dob: string;
  sessions: StudentSession[];
  previous_pending: PendingFee[];
  current_year_fees: number;
  payments: Payment[];
  notes?: string;
}

export interface ClassFeeConfig {
  class_name: string;
  fee_structure: { [session: string]: number };
}

export type Page = 'Dashboard' | 'Students' | 'Payments' | 'Reports' | 'Settings';