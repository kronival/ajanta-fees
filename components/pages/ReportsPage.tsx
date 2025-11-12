import React, { useState, useMemo, useContext } from 'react';
import { DataContext } from '../../context/DataContext';
import { Student, Payment } from '../../types';
import { ACADEMIC_YEAR, ALL_CLASSES } from '../../constants';

const ReportsPage: React.FC = () => {
  const { students } = useContext(DataContext);
  const [activeTab, setActiveTab] = useState('outstanding');

  const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

  const calculateOutstanding = (student: Student) => {
    const totalPreviousPending = student.previous_pending.reduce((sum, p) => sum + p.amount, 0);
    const paidCurrentYear = student.payments
        .flatMap(p => p.applied_to)
        .filter(a => a.year === ACADEMIC_YEAR)
        .reduce((sum, a) => sum + a.amount, 0);
    const currentYearDue = student.current_year_fees - paidCurrentYear;
    return totalPreviousPending + currentYearDue;
  };

  const outstandingReportData = useMemo(() => {
    const data: { [key: string]: { totalStudents: number; totalOutstanding: number; studentsWithDues: number } } = {};
    ALL_CLASSES.forEach(c => {
        data[c] = { totalStudents: 0, totalOutstanding: 0, studentsWithDues: 0 };
    });

    students.forEach(student => {
        const currentClass = student.sessions.find(s => s.session === ACADEMIC_YEAR)?.class;
        if (currentClass && data[currentClass]) {
            data[currentClass].totalStudents++;
            const outstanding = calculateOutstanding(student);
            if (outstanding > 0) {
                data[currentClass].totalOutstanding += outstanding;
                data[currentClass].studentsWithDues++;
            }
        }
    });
    return data;
  }, [students]);

  const allPayments = useMemo(() => {
    const payments: (Payment & { studentName: string; admissionNumber: string; })[] = [];
    students.forEach(student => {
        student.payments.forEach(p => {
            payments.push({
                ...p,
                studentName: student.student_name,
                admissionNumber: student.admission_number
            });
        });
    });
    return payments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [students]);

  const TabButton = ({ name, label }: { name: string; label: string }) => (
    <button
      onClick={() => setActiveTab(name)}
      className={`py-2 px-4 text-sm font-medium rounded-t-lg transition-colors ${
        activeTab === name
          ? 'bg-white dark:bg-gray-800 border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-6">Reports</h1>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          <TabButton name="outstanding" label="Outstanding by Class" />
          <TabButton name="payments" label="Payment History" />
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'outstanding' && (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Students</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Students with Dues</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Outstanding</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {Object.keys(outstandingReportData).map((className) => {
                      const data = outstandingReportData[className];
                      return (
                        <tr key={className}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{className}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{data.totalStudents}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{data.studentsWithDues}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-semibold">{currencyFormatter.format(data.totalOutstanding)}</td>
                        </tr>
                      );
                    })}
                </tbody>
             </table>
          </div>
        )}
        {activeTab === 'payments' && (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Receipt No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Recorded By</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {allPayments.map(p => (
                            <tr key={p.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(p.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{p.receipt_no}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{p.studentName} ({p.admissionNumber})</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-semibold">{currencyFormatter.format(p.amount)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{p.recorded_by.name} ({p.recorded_by.id})</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;