
import React, { createContext, useState, ReactNode } from 'react';
import { Student, Payment, ClassFeeConfig, User } from '../types';
import { INITIAL_STUDENTS, INITIAL_CLASS_FEES, USERS, ACADEMIC_YEAR } from '../constants';

interface DataContextType {
  students: Student[];
  classFees: ClassFeeConfig[];
  users: User[];
  addStudent: (student: Student) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (admissionNumber: string) => void;
  makePayment: (admissionNumber: string, payment: Payment) => void;
  updateClassSessionFee: (className: string, session: string, newAmount: number) => void;
  updateUser: (user: User) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  deleteUser: (userId: string) => void;
}

export const DataContext = createContext<DataContextType>({} as DataContextType);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [classFees, setClassFees] = useState<ClassFeeConfig[]>(INITIAL_CLASS_FEES);
  const [users, setUsers] = useState<User[]>(USERS);

  const addStudent = (student: Student) => {
    setStudents(prev => [...prev, student]);
  };

  const updateStudent = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.admission_number === updatedStudent.admission_number ? updatedStudent : s));
  };
  
  const deleteStudent = (admissionNumber: string) => {
    setStudents(prev => prev.filter(s => s.admission_number !== admissionNumber));
  }

  const updateUser = (updatedUser: User) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const addUser = (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
    setUsers(prev => [...prev, newUser]);
  };
  
  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const makePayment = (admissionNumber: string, payment: Payment) => {
    setStudents(prev => prev.map(student => {
      if (student.admission_number === admissionNumber) {
        const updatedStudent = { ...student, payments: [...student.payments, payment] };
        
        // Deduct from pending fees
        const newPending = [...updatedStudent.previous_pending];
        payment.applied_to.forEach(alloc => {
            const pendingIndex = newPending.findIndex(p => p.year === alloc.year);
            if (pendingIndex !== -1) {
                newPending[pendingIndex].amount -= alloc.amount;
            }
        });
        
        updatedStudent.previous_pending = newPending.filter(p => p.amount > 0.01); // Remove if fully paid, handle float inaccuracies
        return updatedStudent;
      }
      return student;
    }));
  };

  const updateClassSessionFee = (className: string, session: string, newAmount: number) => {
    setClassFees(prev => prev.map(cf => 
        cf.class_name === className 
        ? { ...cf, fee_structure: { ...cf.fee_structure, [session]: newAmount } } 
        : cf
    ));

    if (session === ACADEMIC_YEAR) {
        setStudents(prevStudents => prevStudents.map(student => {
            const inClassAndSession = student.sessions.some(s => s.session === session && s.class === className);
            if (inClassAndSession) {
                return { ...student, current_year_fees: newAmount };
            }
            return student;
        }));
    }
  };

  return (
    <DataContext.Provider value={{ students, classFees, users, addStudent, updateStudent, deleteStudent, makePayment, updateClassSessionFee: updateClassSessionFee, updateUser, addUser, deleteUser }}>
      {children}
    </DataContext.Provider>
  );
};
