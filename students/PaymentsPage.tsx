

import React, { useState, useMemo, useContext, useEffect } from 'react';
import { Student, Role, PaymentAllocation } from '../types';
import { DataContext } from '../context/DataContext';
import { AuthContext } from '../context/AuthContext';
import { ACADEMIC_YEAR, ALL_CLASSES } from '../constants';
import Modal from '../components/common/Modal';

const PaymentsPage: React.FC = () => {
    const { students, makePayment } = useContext(DataContext);
    const { user } = useContext(AuthContext);

    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [paymentMode, setPaymentMode] = useState<'Cash' | 'Cheque' | 'UPI' | 'Card'>('Cash');
    const [allocations, setAllocations] = useState<PaymentAllocation[]>([]);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [lastPayment, setLastPayment] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const studentsInClass = useMemo(() => {
        if (!selectedClass) return [];
        return students
            .filter(s => s.sessions.some(ses => ses.session === ACADEMIC_YEAR && ses.class === selectedClass))
            .sort((a, b) => a.student_name.localeCompare(b.student_name));
    }, [selectedClass, students]);

    const totalPreviousPending = selectedStudent?.previous_pending.reduce((acc, p) => acc + p.amount, 0) || 0;
    
    const paidCurrentYear = selectedStudent?.payments
        .flatMap(p => p.applied_to)
        .filter(a => a.year === ACADEMIC_YEAR)
        .reduce((sum, a) => sum + a.amount, 0) || 0;
        
    const currentYearDue = (selectedStudent?.current_year_fees || 0) - paidCurrentYear;

    const totalOutstanding = totalPreviousPending + currentYearDue;
    
    useEffect(() => {
        setSelectedStudent(null);
    }, [selectedClass]);

    useEffect(() => {
        if (selectedStudent) {
            // Initialize allocations
            const initialAllocs: PaymentAllocation[] = [];
            selectedStudent.previous_pending.forEach(p => {
                initialAllocs.push({ year: p.year, amount: 0 });
            });
            initialAllocs.push({ year: ACADEMIC_YEAR, amount: 0 });
            setAllocations(initialAllocs);
            setPaymentAmount(0);
        } else {
            setAllocations([]);
            setPaymentAmount(0);
        }
    }, [selectedStudent]);
    
    const handleAutoApply = () => {
        let remainingAmount = paymentAmount;
        if (remainingAmount <= 0) return;

        const newAllocations = [...allocations];
        
        // Clear previous auto-applied values
        newAllocations.forEach(a => a.amount = 0);
        
        // Apply to oldest pending fees first
        const sortedPending = selectedStudent?.previous_pending.sort((a,b) => a.year.localeCompare(b.year)) || [];
        
        for (const pending of sortedPending) {
            if (remainingAmount <= 0) break;
            const allocIndex = newAllocations.findIndex(a => a.year === pending.year);
            if (allocIndex > -1) {
                const amountToApply = Math.min(remainingAmount, pending.amount);
                newAllocations[allocIndex].amount = amountToApply;
                remainingAmount -= amountToApply;
            }
        }
        
        // Apply remaining to current year
        if (remainingAmount > 0) {
            const currentYearAllocIndex = newAllocations.findIndex(a => a.year === ACADEMIC_YEAR);
            if (currentYearAllocIndex > -1) {
                const amountToApply = Math.min(remainingAmount, currentYearDue);
                newAllocations[currentYearAllocIndex].amount = amountToApply;
            }
        }
        setAllocations(newAllocations);
    };

    const handleAllocationChange = (year: string, amount: number) => {
        const newAllocations = allocations.map(a => a.year === year ? { ...a, amount } : a);
        setAllocations(newAllocations);
    }
    
    const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);

    const handleSubmitPayment = async () => {
        if (!selectedStudent || !user) {
            alert("Please select a student.");
            return;
        }
        if (paymentAmount <= 0) {
            alert("Payment amount must be greater than zero.");
            return;
        }
        if (totalAllocated !== paymentAmount) {
            alert(`Total allocated amount (${totalAllocated.toFixed(2)}) must equal the payment amount (${paymentAmount.toFixed(2)}).`);
            return;
        }
        
        setIsProcessing(true);
        const finalAllocations = allocations.filter(a => a.amount > 0);
        const receiptNo = `R${Date.now()}`;
        const newPayment = {
            id: `P${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            amount: paymentAmount,
            mode: paymentMode,
            applied_to: finalAllocations,
            receipt_no: receiptNo,
            recorded_by: {id: user.id, name: user.name }
        };

        await makePayment(selectedStudent.admission_number, newPayment);

        setLastPayment({
            student: selectedStudent,
            payment: newPayment,
        });
        setIsReceiptModalOpen(true);
        setSelectedStudent(null);
        setSelectedClass('');
        setIsProcessing(false);
    };

    const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-6">Record Payment</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Student Selection & Details */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">1. Select Student</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Class</label>
                                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                    <option value="">Select a class</option>
                                    {ALL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Student</label>
                                <select 
                                    value={selectedStudent?.admission_number || ''} 
                                    onChange={e => setSelectedStudent(students.find(s => s.admission_number === e.target.value) || null)}
                                    disabled={!selectedClass}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-200 dark:disabled:bg-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="">Select a student</option>
                                    {studentsInClass.map(s => <option key={s.admission_number} value={s.admission_number}>{s.student_name} ({s.admission_number})</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    {selectedStudent && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Fee Summary</h3>
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <div className="flex justify-between"><span>Previous Pending:</span> <span className="font-medium">{currencyFormatter.format(totalPreviousPending)}</span></div>
                                <div className="flex justify-between"><span>Current Year Due:</span> <span className="font-medium">{currencyFormatter.format(currentYearDue)}</span></div>
                                <hr className="my-2 dark:border-gray-600"/>
                                <div className="flex justify-between text-base font-bold text-gray-800 dark:text-white"><span>Total Outstanding:</span> <span>{currencyFormatter.format(totalOutstanding)}</span></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Payment Entry */}
                <div className="lg:col-span-2">
                    {selectedStudent ? (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                             <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">2. Enter Payment Details</h2>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Amount</label>
                                    <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Mode</label>
                                    <select value={paymentMode} onChange={e => setPaymentMode(e.target.value as 'Cash' | 'Cheque' | 'UPI' | 'Card')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <option>Cash</option>
                                        <option>UPI</option>
                                        <option>Card</option>
                                        <option>Cheque</option>
                                    </select>
                                </div>
                            </div>
                            <h3 className="text-md font-semibold my-4 text-gray-700 dark:text-gray-200">3. Allocate Payment</h3>
                            <div className="space-y-3">
                                {selectedStudent.previous_pending.filter(p => p.amount > 0).map(p => (
                                    <div key={p.year} className="flex items-center gap-4">
                                        <label className="w-1/3 text-sm text-gray-600 dark:text-gray-300">Pending {p.year}: <span className="font-mono">{currencyFormatter.format(p.amount)}</span></label>
                                        <input type="number" value={allocations.find(a => a.year === p.year)?.amount || 0} onChange={e => handleAllocationChange(p.year, parseFloat(e.target.value) || 0)} max={p.amount} className="block w-2/3 rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                ))}
                                 <div className="flex items-center gap-4">
                                    <label className="w-1/3 text-sm text-gray-600 dark:text-gray-300">Current Year ({ACADEMIC_YEAR}): <span className="font-mono">{currencyFormatter.format(currentYearDue)}</span></label>
                                    <input type="number" value={allocations.find(a => a.year === ACADEMIC_YEAR)?.amount || 0} onChange={e => handleAllocationChange(ACADEMIC_YEAR, parseFloat(e.target.value) || 0)} max={currentYearDue} className="block w-2/3 rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row justify-between items-center mt-6 pt-4 border-t dark:border-gray-700 gap-4">
                                <div className="text-sm">
                                    <span className="font-semibold text-gray-800 dark:text-white">Total Allocated: {currencyFormatter.format(totalAllocated)}</span>
                                    {totalAllocated !== paymentAmount && <p className="text-red-500 text-xs">Allocated amount does not match payment amount.</p>}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleAutoApply} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Auto-Apply</button>
                                    <button onClick={handleSubmitPayment} disabled={totalAllocated !== paymentAmount || paymentAmount <= 0 || isProcessing} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed">
                                        {isProcessing ? 'Processing...' : 'Confirm & Generate Receipt'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-inner">
                            <p className="text-gray-500 dark:text-gray-400">Please select a student to proceed with payment.</p>
                        </div>
                    )}
                </div>
            </div>
             <Modal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} title="Payment Receipt">
                {lastPayment && (
                    <div className="text-sm text-gray-800 dark:text-gray-200 space-y-3">
                        <div className="text-center mb-4">
                            <h2 className="font-bold text-lg">School Name</h2>
                            <p>Fee Receipt</p>
                        </div>
                        <p><strong>Receipt No:</strong> {lastPayment.payment.receipt_no}</p>
                        <p><strong>Date:</strong> {new Date(lastPayment.payment.date).toLocaleDateString()}</p>
                        <p><strong>Admission No:</strong> {lastPayment.student.admission_number}</p>
                        <p><strong>Student Name:</strong> {lastPayment.student.student_name}</p>
                        <hr className="my-2 dark:border-gray-600"/>
                        <p className="font-bold text-base">Total Amount Paid: {currencyFormatter.format(lastPayment.payment.amount)}</p>
                        <p><strong>Mode:</strong> {lastPayment.payment.mode}</p>
                        <div className="mt-2">
                            <h4 className="font-semibold">Payment Allocation:</h4>
                            <ul className="list-disc pl-5">
                            {lastPayment.payment.applied_to.map((alloc: PaymentAllocation) => (
                                <li key={alloc.year}>{alloc.year}: {currencyFormatter.format(alloc.amount)}</li>
                            ))}
                            </ul>
                        </div>
                        <p className="mt-4 text-xs">Recorded by: {lastPayment.payment.recorded_by.name}</p>
                         <div className="flex justify-end mt-6">
                            <button onClick={() => window.print()} className="py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Print</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PaymentsPage;