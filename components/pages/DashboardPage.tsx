import React, { useMemo, useContext } from 'react';
import { DataContext } from '../../context/DataContext';
import { AuthContext } from '../../context/AuthContext';
import { Student, Payment } from '../../types';
import { ACADEMIC_YEAR, ALL_CLASSES } from '../../constants';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${color}`}>
            {icon}
        </div>
    </div>
);

const DashboardPage: React.FC = () => {
    const { students } = useContext(DataContext);
    const { user } = useContext(AuthContext);

    const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

    const dashboardData = useMemo(() => {
        let totalOutstanding = 0;
        let studentsWithDues = 0;
        let totalCollectedToday = 0;
        const allPayments: (Payment & { studentName: string; admissionNumber: string; })[] = [];
        const todayString = new Date().toISOString().split('T')[0];

        // Initialize class counts
        const classCounts: { [key: string]: number } = {};
        ALL_CLASSES.forEach(c => classCounts[c] = 0);

        const calculateOutstanding = (student: Student) => {
            const totalPreviousPending = student.previous_pending.reduce((sum, p) => sum + p.amount, 0);
            const paidCurrentYear = student.payments
                .flatMap(p => p.applied_to)
                .filter(a => a.year === ACADEMIC_YEAR)
                .reduce((sum, a) => sum + a.amount, 0);
            const currentYearDue = student.current_year_fees - paidCurrentYear;
            return totalPreviousPending + currentYearDue;
        };
        
        const uniqueStudentsWithDues = new Set<string>();

        students.forEach(student => {
            const outstanding = calculateOutstanding(student);
            if (outstanding > 0.01) { // Using a small threshold for float inaccuracies
                totalOutstanding += outstanding;
                uniqueStudentsWithDues.add(student.admission_number);
            }
            
            student.payments.forEach(p => {
                allPayments.push({ ...p, studentName: student.student_name, admissionNumber: student.admission_number });
                if (p.date === todayString) {
                    totalCollectedToday += p.amount;
                }
            });

            // Calculate Class Counts based on current session
            const currentSession = student.sessions.find(s => s.session === ACADEMIC_YEAR);
            if (currentSession && currentSession.class) {
                if (classCounts[currentSession.class] !== undefined) {
                    classCounts[currentSession.class]++;
                }
            }
        });
        
        studentsWithDues = uniqueStudentsWithDues.size;
        
        const recentPayments = allPayments
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
            
        return {
            totalStudents: students.length,
            totalOutstanding,
            studentsWithDues,
            totalCollectedToday,
            recentPayments,
            classCounts
        };

    }, [students]);

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-300">Welcome back, {user?.name}. Here's a summary of the school's finances.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
                <StatCard 
                    title="Total Outstanding" 
                    value={currencyFormatter.format(dashboardData.totalOutstanding)} 
                    color="bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 18v-2m0-10V5m0 2v.01M12 18v-2m0-10V5m0 2v.01M12 18v-2m0-10V5m0 2v.01M7 12h10"></path></svg>}
                />
                 <StatCard 
                    title="Students with Dues" 
                    value={dashboardData.studentsWithDues} 
                    color="bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-300"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                />
                 <StatCard 
                    title="Collected Today" 
                    value={currencyFormatter.format(dashboardData.totalCollectedToday)} 
                    color="bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-300"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>}
                />
                <StatCard 
                    title="Total Students" 
                    value={dashboardData.totalStudents}
                    color="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300"
                    icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>}
                />
            </div>
            
            {/* Student Count Per Class Section */}
            <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Class Strength</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {ALL_CLASSES.map(className => (
                        <div key={className} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex flex-col items-center justify-center hover:shadow-md transition-shadow">
                             <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Class {className}</span>
                             <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                                {dashboardData.classCounts[className] || 0}
                             </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8 bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
                <h2 className="p-6 text-lg font-semibold text-gray-800 dark:text-white border-b dark:border-gray-700">Recent Payments</h2>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Receipt No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                       {dashboardData.recentPayments.length > 0 ? (
                           dashboardData.recentPayments.map(p => (
                                <tr key={p.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(p.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{p.receipt_no}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{p.studentName} ({p.admissionNumber})</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-semibold">{currencyFormatter.format(p.amount)}</td>
                                </tr>
                            ))
                       ) : (
                           <tr>
                               <td colSpan={4} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                   No recent payments to display.
                               </td>
                           </tr>
                       )}
                    </tbody>
                </table>
            </div>

        </div>
    );
};

export default DashboardPage;