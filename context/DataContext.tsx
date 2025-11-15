
import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { Student, Payment, ClassFeeConfig, User } from '../types';
import { ACADEMIC_YEAR, USERS, INITIAL_CLASS_FEES, INITIAL_STUDENTS } from '../constants';

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
  isConnected: boolean;
  refreshData: () => Promise<void>;
}

export const DataContext = createContext<DataContextType>({} as DataContextType);

const API_URL = 'http://localhost:3001/api';

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classFees, setClassFees] = useState<ClassFeeConfig[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const fetchData = async () => {
    try {
      const usersRes = await fetch(`${API_URL}/users`);
      if (!usersRes.ok) throw new Error("Backend unreachable");
      const feesRes = await fetch(`${API_URL}/class-fees`);
      const studentsRes = await fetch(`${API_URL}/students`);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (feesRes.ok) setClassFees(await feesRes.json());
      if (studentsRes.ok) setStudents(await studentsRes.json());
      
      setIsConnected(true);
    } catch (error) {
      console.warn("Failed to fetch data from backend. Backend might be down. Using local fallback data.", error);
      // Fallback to local constants if backend fails
      setUsers(USERS);
      setClassFees(INITIAL_CLASS_FEES);
      setStudents(INITIAL_STUDENTS);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addStudent = async (student: Student) => {
    try {
        const res = await fetch(`${API_URL}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(student)
        });
        if (!res.ok) throw new Error('Failed to add student');
        await fetchData();
    } catch (e) {
        console.error(e);
        alert("Error: Could not connect to backend. Student was not saved.");
    }
  };

  const updateStudent = async (updatedStudent: Student) => {
    try {
        const res = await fetch(`${API_URL}/students/${updatedStudent.admission_number}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedStudent)
        });
        if (!res.ok) throw new Error('Failed to update student');
        await fetchData();
    } catch (e) {
        console.error(e);
        alert("Error: Could not connect to backend. Changes were not saved.");
    }
  };
  
  const deleteStudent = async (admissionNumber: string) => {
    try {
        const res = await fetch(`${API_URL}/students/${admissionNumber}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete student');
        await fetchData();
    } catch (e) {
        console.error(e);
        alert("Error: Could not connect to backend.");
    }
  }

  const updateUser = async (updatedUser: User) => {
    try {
        const res = await fetch(`${API_URL}/users/${updatedUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser)
        });
        if (!res.ok) throw new Error('Failed to update user');
        await fetchData();
    } catch (e) {
        console.error(e);
        alert("Error: Could not connect to backend.");
    }
  };

  const addUser = async (user: Omit<User, 'id'>) => {
    try {
         const newUser = { ...user, id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
         const res = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });
        if (!res.ok) throw new Error('Failed to add user');
        await fetchData();
    } catch (e) {
        console.error(e);
        alert("Error: Could not connect to backend.");
    }
  };
  
  const deleteUser = async (userId: string) => {
    try {
        const res = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete user');
        await fetchData();
    } catch (e) {
        console.error(e);
        alert("Error: Could not connect to backend.");
    }
  };

  const makePayment = async (admissionNumber: string, payment: Payment) => {
    try {
        const res = await fetch(`${API_URL}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admissionNumber, payment })
        });
        if (!res.ok) throw new Error('Failed to record payment');
        await fetchData(); 
    } catch (e) {
        console.error(e);
        alert("Error: Could not connect to backend. Payment was not recorded.");
    }
  };

  const updateClassSessionFee = async (className: string, session: string, newAmount: number) => {
    try {
        // Find the current config to update
        const currentConfig = classFees.find(cf => cf.class_name === className);
        if (!currentConfig) return;

        const updatedFeeStructure = { ...currentConfig.fee_structure, [session]: newAmount };

        const res = await fetch(`${API_URL}/class-fees/${className}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                fee_structure: updatedFeeStructure,
                session, 
                newAmount 
            })
        });
        if (!res.ok) throw new Error('Failed to update fees');
        await fetchData();
    } catch (e) {
        console.error(e);
        alert("Error: Could not connect to backend.");
    }
  };

  return (
    <DataContext.Provider value={{ students, classFees, users, addStudent, updateStudent, deleteStudent, makePayment, updateClassSessionFee, updateUser, addUser, deleteUser, isConnected, refreshData: fetchData }}>
      {children}
    </DataContext.Provider>
  );
};
