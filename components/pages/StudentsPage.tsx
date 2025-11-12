

import React, { useState, useMemo, useContext } from 'react';
import { Student, Role } from '../../types';
import Modal from '../common/Modal';
import StudentForm from '../../students/StudentForm';
import { DataContext } from '../../context/DataContext';
import { AuthContext } from '../../context/AuthContext';
import { ACADEMIC_YEAR } from '../../constants';
import { PlusIcon, EditIcon, DeleteIcon } from '../Icons';

const StudentsPage: React.FC = () => {
  const { students, addStudent, updateStudent, deleteStudent, classFees } = useContext(DataContext);
  const { user } = useContext(AuthContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<Student | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenModal = (student: Student | null = null) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingStudent(null);
    setIsModalOpen(false);
  };

  const handleSaveStudent = async (student: Student) => {
    setIsSaving(true);
    if (editingStudent) {
      await updateStudent(student);
    } else {
      await addStudent(student);
    }
    setIsSaving(false);
    handleCloseModal();
  };

  const handleDelete = async (student: Student) => {
      if (student) {
        setIsDeleting(true);
        await deleteStudent(student.admission_number);
        setIsDeleting(false);
        setShowConfirmDelete(null);
      }
  }

  const filteredStudents = useMemo(() => {
    return students.filter(s =>
      s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admission_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.father_name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => a.student_name.localeCompare(b.student_name));
  }, [students, searchTerm]);

  const canModify = user?.role === Role.Admin || user?.role === Role.Accountant;
  const canDelete = user?.role === Role.Admin;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Manage Students</h1>
        {canModify && (
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 transition-colors">
            <PlusIcon />
            Add Student
          </button>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, admission no, or father's name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Admission No</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Class</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Father's Name</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredStudents.map((student) => {
                const currentSession = student.sessions.find(s => s.session === ACADEMIC_YEAR);
                return (
                    <tr key={student.admission_number}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{student.admission_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{student.student_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{currentSession?.class || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{student.father_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center gap-2">
                            {canModify && (
                                <button onClick={() => handleOpenModal(student)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1">
                                    <EditIcon />
                                </button>
                            )}
                            {canDelete && (
                                <button onClick={() => setShowConfirmDelete(student)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1">
                                    <DeleteIcon />
                                </button>
                            )}
                        </div>
                        </td>
                    </tr>
                )
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingStudent ? 'Edit Student' : 'Add Student'} size="xl">
        <StudentForm
          student={editingStudent}
          onSave={handleSaveStudent}
          onClose={handleCloseModal}
          existingAdmissionNumbers={students.map(s => s.admission_number)}
          classFees={classFees}
          isSaving={isSaving}
        />
      </Modal>

      {showConfirmDelete && (
        <Modal isOpen={!!showConfirmDelete} onClose={() => setShowConfirmDelete(null)} title="Confirm Deletion">
          <div className="text-gray-800 dark:text-gray-200">
            <p>Are you sure you want to permanently delete student <span className="font-bold">{showConfirmDelete.student_name} ({showConfirmDelete.admission_number})</span>?</p>
            <p className="text-sm text-red-500 mt-2">This action cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button onClick={() => setShowConfirmDelete(null)} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                Cancel
            </button>
            <button onClick={() => handleDelete(showConfirmDelete)} disabled={isDeleting} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed">
                {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StudentsPage;
