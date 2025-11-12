import React from 'react';
import { Student } from '../types';
import Modal from '../components/common/Modal';
import { ACADEMIC_YEAR } from '../constants';

interface StudentDetailModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

const calculateFeeSummary = (student: Student) => {
    const totalPreviousPending = student.previous_pending.reduce((sum, p) => sum + p.amount, 0);
    
    const paidPreviousYears = student.payments
        .flatMap(p => p.applied_to)
        .filter(a => a.year !== ACADEMIC_YEAR)
        .reduce((sum, a) => sum + a.amount, 0);

    const paidCurrentYear = student.payments
        .flatMap(p => p.applied_to)
        .filter(a => a.year === ACADEMIC_YEAR)
        .reduce((sum, a) => sum + a.amount, 0);
        
    const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);

    const outstandingCurrentYear = student.current_year_fees - paidCurrentYear;
    const outstanding = totalPreviousPending + outstandingCurrentYear;
    
    const totalFees = student.current_year_fees + paidPreviousYears + totalPreviousPending;

    return { totalFees, totalPaid, outstanding };
};


const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student, isOpen, onClose }) => {
  if (!student) return null;
  
  const feeSummary = calculateFeeSummary(student);
  const currentSession = student.sessions.find(s => s.session === ACADEMIC_YEAR);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Student Details" size="xl">
      <div className="text-gray-800 dark:text-gray-200">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 pb-4 border-b dark:border-gray-700">
            <div>
                <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{student.student_name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Admission No: {student.admission_number}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Class: {currentSession?.class || 'N/A'}</p>
            </div>
            <div className="text-left md:text-right mt-4 md:mt-0">
                 <p className="text-sm"><strong>Father:</strong> {student.father_name}</p>
                 <p className="text-sm"><strong>Mother:</strong> {student.mother_name || 'N/A'}</p>
                 <p className="text-sm"><strong>DOB:</strong> {new Date(student.dob).toLocaleDateString()}</p>
            </div>
        </div>

        {/* Fee Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Fees</p>
                <p className="text-xl font-semibold">{currencyFormatter.format(feeSummary.totalFees)}</p>
            </div>
            <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Paid</p>
                <p className="text-xl font-semibold text-green-600 dark:text-green-400">{currencyFormatter.format(feeSummary.totalPaid)}</p>
            </div>
            <div className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding Balance</p>
                <p className={`text-xl font-semibold ${feeSummary.outstanding > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-white'}`}>
                    {currencyFormatter.format(feeSummary.outstanding)}
                </p>
            </div>
        </div>
        
        {/* Payment History */}
        <div>
            <h3 className="text-lg font-semibold mb-2">Payment History</h3>
            <div className="overflow-x-auto max-h-64 border rounded-lg dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Receipt No</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Mode</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Allocation</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {student.payments.length > 0 ? (
                            [...student.payments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(payment => (
                                <tr key={payment.id}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{new Date(payment.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{payment.receipt_no}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{currencyFormatter.format(payment.amount)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{payment.mode}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                                        {payment.applied_to.map(a => `${a.year}: ${currencyFormatter.format(a.amount)}`).join(', ')}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center py-5 text-gray-500 dark:text-gray-400">
                                    No payments recorded for this student.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </Modal>
  );
};

export default StudentDetailModal;
