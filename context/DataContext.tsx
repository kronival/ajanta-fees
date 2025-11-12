
import React, { createContext, useState, ReactNode } from 'react';
import { Student, Payment, ClassFeeConfig, User } from '../types';
import { INITIAL_STUDENTS, INITIAL_CLASS_FEES, USERS, ACADEMIC_YEAR } from '../constants';

interface DataContextType {
  students: Student[];
  classFees: ClassFeeConfig[];
  users: User[];
  addStudent: (student: Student) => Promise<void>;
  updateStudent: (student: Student) => Promise<void>;
  deleteStudent: (admissionNumber: string) => Promise<void>;
  makePayment: (admissionNumber: string, payment: Payment) => Promise<void>;
  updateClassSessionFee: (className: string, session: string, newAmount: number) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

export const DataContext = createContext<DataContextType>({} as DataContextType);

const simulateApiCall = (callback: () => void, delay = 500): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            callback();
            resolve();
        }, delay);
    });
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [classFees, setClassFees] = useState<ClassFeeConfig[]>(INITIAL_CLASS_FEES);
  const [users, setUsers] = useState<User[]>(USERS);

  const addStudent = async (student: Student) => {
    await simulateApiCall(() => {
      setStudents(prev => [...prev, student]);
    });
  };

  const updateStudent = async (updatedStudent: Student) => {
    await simulateApiCall(() => {
      setStudents(prev => prev.map(s => s.admission_number === updatedStudent.admission_number ? updatedStudent : s));
    });
  };
  
  const deleteStudent = async (admissionNumber: string) => {
    await simulateApiCall(() => {
      setStudents(prev => prev.filter(s => s.admission_number !== admissionNumber));
    });
  }

  const updateUser = async (updatedUser: User) => {
     await simulateApiCall(() => {
        setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
    });
  };

  const addUser = async (user: Omit<User, 'id'>) => {
     await simulateApiCall(() => {
        const newUser = { ...user, id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
        setUsers(prev => [...prev, newUser]);
    });
  };
  
  const deleteUser = async (userId: string) => {
    await simulateApiCall(() => {
        setUsers(prev => prev.filter(u => u.id !== userId));
    });
  };

  const makePayment = async (admissionNumber: string, payment: Payment) => {
    await simulateApiCall(() => {
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
    });
  };

  const updateClassSessionFee = async (className: string, session: string, newAmount: number) => {
    await simulateApiCall(() => {
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
    });
  };

  return (
    <DataContext.Provider value={{ students, classFees, users, addStudent, updateStudent, deleteStudent, makePayment, updateClassSessionFee: updateClassSessionFee, updateUser, addUser, deleteUser }}>
      {children}
    </DataContext.Provider>
  );
};
