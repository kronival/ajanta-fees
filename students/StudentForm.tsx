
import React, { useState, useEffect } from 'react';
import { Student, ClassFeeConfig, PendingFee, StudentSession } from '../types';
import { ACADEMIC_YEAR, ALL_CLASSES } from '../constants';
import { PlusIcon, DeleteIcon } from '../components/Icons';

interface StudentFormProps {
  student: Student | null;
  onSave: (student: Student) => void;
  onClose: () => void;
  existingAdmissionNumbers: string[];
  classFees: ClassFeeConfig[];
}

const StudentForm: React.FC<StudentFormProps> = ({ student, onSave, onClose, existingAdmissionNumbers, classFees }) => {
  const [formData, setFormData] = useState({
    admission_number: '',
    student_name: '',
    father_name: '',
    mother_name: '',
    dob: '',
    notes: '',
  });

  const [sessions, setSessions] = useState<StudentSession[]>([]);
  const [previousPending, setPreviousPending] = useState<PendingFee[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const isEditing = !!student;

  useEffect(() => {
    if (student) {
      setFormData({
        admission_number: student.admission_number,
        student_name: student.student_name,
        father_name: student.father_name,
        mother_name: student.mother_name,
        dob: student.dob,
        notes: student.notes || '',
      });
      setSessions(student.sessions);
      setPreviousPending(student.previous_pending);
    } else {
      // Reset form for new student
      setFormData({
        admission_number: '',
        student_name: '',
        father_name: '',
        mother_name: '',
        dob: '',
        notes: '',
      });
      setSessions([{ session: ACADEMIC_YEAR, class: '' }]);
      setPreviousPending([]);
    }
  }, [student]);

  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    if (!formData.admission_number.trim()) newErrors.admission_number = 'Admission number is required.';
    if (!isEditing && existingAdmissionNumbers.includes(formData.admission_number.trim())) {
      newErrors.admission_number = 'Admission number already exists.';
    }
    if (!formData.student_name.trim()) newErrors.student_name = 'Student name is required.';
    if (!formData.father_name.trim()) newErrors.father_name = 'Father\'s name is required.';
    if (!formData.dob) newErrors.dob = 'Date of birth is required.';
    
    if (sessions.length === 0) {
        newErrors.sessions = 'At least one academic session is required.';
    }
    const sessionYears = new Set<string>();
    sessions.forEach((s, index) => {
        const sessionYear = s.session.trim();
        if (!sessionYear) newErrors[`session_year_${index}`] = 'Session year is required.';
        if (sessionYears.has(sessionYear)) newErrors[`session_year_${index}`] = 'Duplicate session year.';
        if (sessionYear) sessionYears.add(sessionYear);
        if (!s.class) newErrors[`session_class_${index}`] = 'Class is required.';
    });

    previousPending.forEach((p, index) => {
        if (!p.year.trim()) newErrors[`pending_year_${index}`] = 'Year is required.';
        if (p.amount <= 0) newErrors[`pending_amount_${index}`] = 'Amount must be positive.';
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSessionChange = (index: number, field: keyof StudentSession, value: string) => {
    const newSessions = [...sessions];
    newSessions[index][field] = value;
    setSessions(newSessions);
  };
  
  const addSession = () => {
    setSessions([...sessions, { session: '', class: '' }]);
  };

  const removeSession = (index: number) => {
    setSessions(sessions.filter((_, i) => i !== index));
  };


  const handlePendingChange = (index: number, field: 'year' | 'amount', value: string | number) => {
    const newPending = [...previousPending];
    if (field === 'amount') {
        newPending[index][field] = Number(value);
    } else {
        newPending[index][field] = value as string;
    }
    setPreviousPending(newPending);
  };

  const addPendingField = () => {
    setPreviousPending([...previousPending, { year: '', amount: 0 }]);
  };

  const removePendingField = (index: number) => {
    setPreviousPending(previousPending.filter((_, i) => i !== index));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const currentSession = sessions.find(s => s.session === ACADEMIC_YEAR);
    const feeConfig = currentSession ? classFees.find(cf => cf.class_name === currentSession.class) : undefined;
    const currentYearFeeAmount = (currentSession && feeConfig)
      ? feeConfig.fee_structure[currentSession.session] || 0
      : 0;

    const savedStudentData: Student = {
      ...(student || { payments: [] }),
      admission_number: formData.admission_number.trim(),
      student_name: formData.student_name.trim(),
      father_name: formData.father_name.trim(),
      mother_name: formData.mother_name.trim(),
      dob: formData.dob,
      sessions: sessions.filter(s => s.session && s.class),
      previous_pending: isEditing ? student.previous_pending : previousPending.filter(p => p.year && p.amount > 0),
      current_year_fees: currentYearFeeAmount,
      notes: formData.notes.trim(),
    };

    onSave(savedStudentData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Admission Number</label>
          <input
            type="text"
            name="admission_number"
            value={formData.admission_number}
            onChange={handleChange}
            disabled={isEditing}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600"
          />
          {errors.admission_number && <p className="text-sm text-red-500 mt-1">{errors.admission_number}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Student Name</label>
          <input
            type="text"
            name="student_name"
            value={formData.student_name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {errors.student_name && <p className="text-sm text-red-500 mt-1">{errors.student_name}</p>}
        </div>
         <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {errors.dob && <p className="text-sm text-red-500 mt-1">{errors.dob}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Father's Name</label>
          <input
            type="text"
            name="father_name"
            value={formData.father_name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {errors.father_name && <p className="text-sm text-red-500 mt-1">{errors.father_name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mother's Name</label>
          <input
            type="text"
            name="mother_name"
            value={formData.mother_name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      <div className="pt-4 border-t dark:border-gray-700">
        <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Academic Sessions</h4>
        {errors.sessions && <p className="text-sm text-red-500 mb-2">{errors.sessions}</p>}
        <div className="space-y-2">
            {sessions.map((s, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start">
                    <div className="md:col-span-1">
                        <input
                            type="text"
                            placeholder="Session (e.g., 2025-26)"
                            value={s.session}
                            onChange={(e) => handleSessionChange(index, 'session', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                        />
                        {errors[`session_year_${index}`] && <p className="text-xs text-red-500 mt-1">{errors[`session_year_${index}`]}</p>}
                    </div>
                    <div className="md:col-span-1">
                         <select
                            value={s.class}
                            onChange={(e) => handleSessionChange(index, 'class', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                         >
                            <option value="">Select a class</option>
                            {ALL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {errors[`session_class_${index}`] && <p className="text-xs text-red-500 mt-1">{errors[`session_class_${index}`]}</p>}
                    </div>
                    <div className="md:col-span-1 flex items-center">
                        <button type="button" onClick={() => removeSession(index)} className="p-2 text-red-500 hover:text-red-700">
                            <DeleteIcon />
                        </button>
                    </div>
                </div>
            ))}
        </div>
        <button type="button" onClick={addSession} className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 mt-2">
            <PlusIcon className="w-4 h-4" /> Add Session
        </button>
      </div>
      
      {!isEditing && (
        <div className="pt-4 border-t dark:border-gray-700">
            <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Previous Pending Fees</h4>
            {previousPending.map((p, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                    <input 
                        type="text"
                        placeholder="Year (e.g., 2024-25)"
                        value={p.year}
                        onChange={(e) => handlePendingChange(index, 'year', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                    />
                    <input 
                        type="number"
                        placeholder="Amount"
                        value={p.amount || ''}
                        onChange={(e) => handlePendingChange(index, 'amount', e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                    />
                    <button type="button" onClick={() => removePendingField(index)} className="p-2 text-red-500 hover:text-red-700">
                        <DeleteIcon />
                    </button>
                </div>
            ))}
             <button type="button" onClick={addPendingField} className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                <PlusIcon className="w-4 h-4" /> Add Pending Fee
            </button>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
        <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t dark:border-gray-700">
        <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
          Cancel
        </button>
        <button type="submit" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
          {isEditing ? 'Save Changes' : 'Add Student'}
        </button>
      </div>
    </form>
  );
};

export default StudentForm;