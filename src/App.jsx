import React, { useState, useEffect, useMemo } from 'react';
import DrivingSimulator from "./DrivingSimulator";
import { 
  CircleDollarSign, 
  TrendingUp, 
  Wallet, 
  Plus, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  RotateCcw,
  Calendar,
  Percent,
  FileText,
  User,
  X,
  CreditCard,
  Banknote,
  History,
  ArrowRightLeft,
  AlertCircle
} from 'lucide-react';

// Initial Mock Data
const MOCK_LOANS = [
  {
    id: '1',
    type: 'lent',
    name: 'Sarah Jenkins',
    principal: 100000,
    rate: 12,
    dateGiven: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
    dueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    note: 'Small business loan for equipment',
    status: 'active',
    settledDate: null,
    payments: [
      { id: 'p1', date: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0], amount: 20000 }
    ]
  },
  {
    id: '2',
    type: 'lent',
    name: 'Michael Chen',
    principal: 45000,
    rate: 8,
    dateGiven: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
    dueDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0], // Overdue example
    note: 'Home renovation',
    status: 'active',
    settledDate: null,
    payments: []
  },
  {
    id: '3',
    type: 'borrowed',
    name: 'Bank Loan',
    principal: 200000,
    rate: 10,
    dateGiven: new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString().split('T')[0],
    dueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString().split('T')[0],
    note: 'Car Loan',
    status: 'active',
    settledDate: null,
    payments: [
      { id: 'p2', date: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0], amount: 50000 }
    ]
  }
];

const calculateLoanMetrics = (loan) => {
  const rate = loan.rate / 100;
  let currentBalance = loan.principal;
  let totalInterestEarned = 0;
  
  let payments = [];
  if (loan.payments && loan.payments.length > 0) {
    payments = [...loan.payments].sort((a, b) => new Date(a.date) - new Date(b.date));
  }
  
  const endDate = loan.status === 'settled' && loan.settledDate 
    ? new Date(loan.settledDate) 
    : new Date();
    
  let events = [...payments];
  
  let finalDate = endDate;
  if (events.length > 0) {
    const lastPaymentDate = new Date(events[events.length - 1].date);
    if (lastPaymentDate > finalDate) finalDate = lastPaymentDate;
  }

  let lastDate = new Date(loan.dateGiven);
  let history = [
    {
      id: 'start',
      type: 'start',
      date: new Date(loan.dateGiven).toISOString().split('T')[0],
      amount: loan.principal,
      interestAccrued: 0,
      balanceAfter: loan.principal
    }
  ];

  events.forEach(event => {
    const eventDate = new Date(event.date);
    
    let diffTime = eventDate.getTime() - lastDate.getTime();
    if (diffTime < 0) diffTime = 0;
    
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    const years = diffDays / 365;
    
    let interestForPeriod = 0;
    if (years > 0 && currentBalance > 0) {
      const newAmount = currentBalance * Math.pow(1 + rate, years);
      interestForPeriod = newAmount - currentBalance;
      totalInterestEarned += interestForPeriod;
      currentBalance = newAmount;
    }
    
    currentBalance -= event.amount;
    if (currentBalance < 0) currentBalance = 0; 
    
    history.push({
      id: event.id,
      type: 'payment',
      date: event.date,
      amount: event.amount,
      interestAccrued: interestForPeriod,
      balanceAfter: currentBalance
    });
    
    lastDate = eventDate;
  });

  let diffTimeFinal = finalDate.getTime() - lastDate.getTime();
  if (diffTimeFinal > 0) {
    const diffDaysFinal = diffTimeFinal / (1000 * 60 * 60 * 24);
    const yearsFinal = diffDaysFinal / 365;
    
    let interestForPeriod = 0;
    if (yearsFinal > 0 && currentBalance > 0) {
      const newAmount = currentBalance * Math.pow(1 + rate, yearsFinal);
      interestForPeriod = newAmount - currentBalance;
      totalInterestEarned += interestForPeriod;
      currentBalance = newAmount;
    }
    
    if (interestForPeriod > 0) {
        history.push({
            id: 'current',
            type: loan.status === 'settled' ? 'settled' : 'current',
            date: finalDate.toISOString().split('T')[0],
            amount: 0,
            interestAccrued: interestForPeriod,
            balanceAfter: currentBalance
        });
    }
  } else if (loan.status === 'settled' && history.length > 0 && history[history.length-1].type !== 'settled') {
       // Just update the last item's type or add a generic settled marker if dates exactly match
       history.push({
            id: 'current',
            type: 'settled',
            date: finalDate.toISOString().split('T')[0],
            amount: 0,
            interestAccrued: 0,
            balanceAfter: currentBalance
       });
  }
  
  let dailyInterest = 0;
  let monthlyInterest = 0;
  
  if (loan.status === 'active' && currentBalance > 0) {
    dailyInterest = (currentBalance * rate) / 365;
    monthlyInterest = (currentBalance * rate) / 12;
  }
  
  return {
    remainingBalance: currentBalance,
    totalInterestEarned,
    dailyInterest,
    monthlyInterest,
    totalPaid: loan.payments ? loan.payments.reduce((sum, p) => sum + p.amount, 0) : 0,
    history
  };
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export default function App() {
  const [loans, setLoans] = useState(() => {
    const saved = localStorage.getItem('loan_dashboard_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse local storage', e);
      }
    }
    return MOCK_LOANS;
  });

  const [viewMode, setViewMode] = useState('lent'); // 'lent' or 'borrowed'

  // Modal states
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activePaymentLoanId, setActivePaymentLoanId] = useState(null);
  
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [activeHistoryLoan, setActiveHistoryLoan] = useState(null);

  const [formData, setFormData] = useState({
    type: 'lent',
    name: '',
    principal: '',
    rate: '',
    dateGiven: new Date().toISOString().split('T')[0],
    dueDate: '',
    note: ''
  });

  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    localStorage.setItem('loan_dashboard_data', JSON.stringify(loans));
  }, [loans]);

  // Filtered loans based on viewMode
  const filteredLoans = useMemo(() => {
    return loans.filter(loan => (loan.type || 'lent') === viewMode);
  }, [loans, viewMode]);

  const dashboardMetrics = useMemo(() => {
    let totalPrincipalLent = 0; 
    let todaysInterestGained = 0;
    let totalValue = 0; 
    let totalInterestEarnedAll = 0;

    filteredLoans.forEach(loan => {
      const metrics = calculateLoanMetrics(loan);
      
      if (loan.status === 'active') {
        totalPrincipalLent += loan.principal;
        todaysInterestGained += metrics.dailyInterest;
      }
      
      totalValue += metrics.remainingBalance;
      totalInterestEarnedAll += metrics.totalInterestEarned;
    });

    return { totalPrincipalLent, todaysInterestGained, totalValue, totalInterestEarnedAll };
  }, [filteredLoans]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentFormData(prev => ({ ...prev, [name]: value }));
  };

  const openLoanForm = (loan = null) => {
    if (loan) {
      setEditingId(loan.id);
      setFormData({
        type: loan.type || 'lent',
        name: loan.name,
        principal: loan.principal,
        rate: loan.rate,
        dateGiven: loan.dateGiven,
        dueDate: loan.dueDate || '',
        note: loan.note
      });
    } else {
      setEditingId(null);
      let futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      setFormData({
        type: viewMode,
        name: '',
        principal: '',
        rate: '',
        dateGiven: new Date().toISOString().split('T')[0],
        dueDate: futureDate.toISOString().split('T')[0],
        note: ''
      });
    }
    setIsLoanModalOpen(true);
  };

  const openPaymentForm = (loanId) => {
    setActivePaymentLoanId(loanId);
    setPaymentFormData({
      amount: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsPaymentModalOpen(true);
  };
  
  const openHistoryModal = (loan) => {
    setActiveHistoryLoan(loan);
    setIsHistoryModalOpen(true);
  };

  const handleLoanFormSubmit = (e) => {
    e.preventDefault();
    
    if (editingId) {
      setLoans(prev => prev.map(loan => {
        if (loan.id === editingId) {
          return {
            ...loan,
            type: formData.type,
            name: formData.name,
            principal: Number(formData.principal),
            rate: Number(formData.rate),
            dateGiven: formData.dateGiven,
            dueDate: formData.dueDate,
            note: formData.note
          };
        }
        return loan;
      }));
    } else {
      const newLoan = {
        id: crypto.randomUUID(),
        type: formData.type,
        name: formData.name,
        principal: Number(formData.principal),
        rate: Number(formData.rate),
        dateGiven: formData.dateGiven,
        dueDate: formData.dueDate,
        note: formData.note,
        status: 'active',
        settledDate: null,
        payments: []
      };
      setLoans(prev => [...prev, newLoan]);
    }
    
    setIsLoanModalOpen(false);
  };

  const handlePaymentFormSubmit = (e) => {
    e.preventDefault();
    if (!activePaymentLoanId) return;

    setLoans(prev => prev.map(loan => {
      if (loan.id === activePaymentLoanId) {
        const newPayment = {
          id: crypto.randomUUID(),
          amount: Number(paymentFormData.amount),
          date: paymentFormData.date
        };
        return {
          ...loan,
          payments: [...(loan.payments || []), newPayment]
        };
      }
      return loan;
    }));

    setIsPaymentModalOpen(false);
  };

  const toggleStatus = (id) => {
    setLoans(prev => prev.map(loan => {
      if (loan.id === id) {
        const isCurrentlyActive = loan.status === 'active';
        return {
          ...loan,
          status: isCurrentlyActive ? 'settled' : 'active',
          settledDate: isCurrentlyActive ? new Date().toISOString().split('T')[0] : null
        };
      }
      return loan;
    }));
  };

  const deleteLoan = (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      setLoans(prev => prev.filter(loan => loan.id !== id));
    }
  };
  
  const isOverdue = (dueDate, status) => {
    if (status === 'settled' || !dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6 md:p-8 selection:bg-indigo-500/20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & View Toggle */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Financial Tracker</h1>
            <p className="text-slate-500 mt-1">Manage your active loans, track partial payments and interest gains.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex bg-slate-200/70 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('lent')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'lent' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Money Lent
              </button>
              <button
                onClick={() => setViewMode('borrowed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'borrowed' 
                    ? 'bg-white text-rose-600 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Money Borrowed
              </button>
            </div>
            
            <button 
              onClick={() => openLoanForm()}
              className={`flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md ${
                viewMode === 'lent'
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
              }`}
            >
              <Plus size={20} />
              <span>Add Record</span>
            </button>
          </div>
        </div>

        < DrivingSimulator />

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Wallet size={80} className={viewMode === 'lent' ? 'text-indigo-600' : 'text-rose-600'} />
            </div>
            <div className={`flex items-center gap-3 mb-2 ${viewMode === 'lent' ? 'text-indigo-600' : 'text-rose-600'}`}>
              <div className={`p-2 rounded-lg ${viewMode === 'lent' ? 'bg-indigo-50' : 'bg-rose-50'}`}>
                <Wallet size={20} />
              </div>
              <h3 className="font-semibold text-xs tracking-wide uppercase">Active Principal</h3>
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-4">
              {formatCurrency(dashboardMetrics.totalPrincipalLent)}
            </div>
            <p className="text-xs text-slate-500 mt-2">Original amounts {viewMode}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Banknote size={80} className="text-emerald-600" />
            </div>
            <div className="flex items-center gap-3 text-emerald-600 mb-2">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Banknote size={20} />
              </div>
              <h3 className="font-semibold text-xs tracking-wide uppercase">
                Total Interest {viewMode === 'lent' ? 'Earned' : 'Owed'}
              </h3>
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-4">
              {formatCurrency(dashboardMetrics.totalInterestEarnedAll)}
            </div>
            <p className="text-xs text-slate-500 mt-2">Cumulative interest across all records</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <TrendingUp size={80} className="text-amber-500" />
            </div>
            <div className="flex items-center gap-3 text-amber-500 mb-2">
              <div className="p-2 bg-amber-50 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-semibold text-xs tracking-wide uppercase">Today's Interest</h3>
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-4">
              {formatCurrency(dashboardMetrics.todaysInterestGained)}
            </div>
            <p className="text-xs text-slate-500 mt-2">Combined daily interest added</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <CircleDollarSign size={80} className="text-blue-600" />
            </div>
            <div className="flex items-center gap-3 text-blue-600 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <CircleDollarSign size={20} />
              </div>
              <h3 className="font-semibold text-xs tracking-wide uppercase">Total Remaining Balance</h3>
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-4">
              {formatCurrency(dashboardMetrics.totalValue)}
            </div>
            <p className="text-xs text-slate-500 mt-2">Current outstanding balance</p>
          </div>
        </div>

        {/* Loans Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                  <th className="p-4 font-semibold w-24">Status</th>
                  <th className="p-4 font-semibold">{viewMode === 'lent' ? 'Borrower' : 'Lender'}</th>
                  <th className="p-4 font-semibold">Principal & Rate</th>
                  <th className="p-4 font-semibold">Interest {viewMode === 'lent' ? 'Earned' : 'Owed'}</th>
                  <th className="p-4 font-semibold">Remaining Balance</th>
                  <th className="p-4 font-semibold">Est. Gains</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500">
                      No records found. Add a new {viewMode === 'lent' ? 'loan' : 'borrowing'} record to get started.
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map(loan => {
                    const metrics = calculateLoanMetrics(loan);
                    const isSettled = loan.status === 'settled';
                    const hasPayments = loan.payments && loan.payments.length > 0;
                    const overdue = isOverdue(loan.dueDate, loan.status);

                    return (
                      <tr key={loan.id} className={`transition-colors hover:bg-slate-50/50 ${isSettled ? 'bg-slate-50/30 opacity-70' : ''}`}>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                            isSettled 
                              ? 'bg-slate-100 text-slate-600 border-slate-200' 
                              : overdue
                                ? 'bg-red-50 text-red-700 border-red-200 shadow-sm'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {isSettled ? <CheckCircle2 size={12} /> : overdue ? <AlertCircle size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                            {isSettled ? 'Settled' : overdue ? 'Overdue' : 'Active'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-900">{loan.name}</div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(loan.dateGiven).toLocaleDateString()}</span>
                            {loan.dueDate && (
                              <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : ''}`}>
                                <ArrowRightLeft size={12} /> {new Date(loan.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {loan.note && (
                            <div className="text-xs text-slate-400 mt-1 truncate max-w-[150px]" title={loan.note}>
                              {loan.note}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-slate-900">{formatCurrency(loan.principal)}</div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Percent size={12} />
                            {loan.rate}% APY
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-emerald-600">+{formatCurrency(metrics.totalInterestEarned)}</div>
                          {hasPayments && (
                            <div className="text-xs text-slate-500 mt-1">Paid: {formatCurrency(metrics.totalPaid)}</div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900 text-lg">{formatCurrency(metrics.remainingBalance)}</div>
                        </td>
                        <td className="p-4">
                          {isSettled ? (
                            <span className="text-sm text-slate-400">—</span>
                          ) : (
                            <div className="space-y-1">
                              <div className="text-xs text-slate-600 flex justify-between gap-4">
                                <span>Daily:</span>
                                <span className="text-emerald-600 font-medium">+{formatCurrency(metrics.dailyInterest)}</span>
                              </div>
                              <div className="text-xs text-slate-600 flex justify-between gap-4">
                                <span>Monthly:</span>
                                <span className="text-emerald-600 font-medium">+{formatCurrency(metrics.monthlyInterest)}</span>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openHistoryModal(loan)}
                              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200"
                              title="View Transaction History"
                            >
                              <History size={18} />
                            </button>
                            {!isSettled && (
                              <button
                                onClick={() => openPaymentForm(loan.id)}
                                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                                title="Record Partial Payment"
                              >
                                <CreditCard size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => toggleStatus(loan.id)}
                              title={isSettled ? "Reopen Record" : "Mark as Settled"}
                              className={`p-2 rounded-lg transition-colors border ${
                                isSettled 
                                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200' 
                                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-100'
                              }`}
                            >
                              {isSettled ? <RotateCcw size={18} /> : <CheckCircle2 size={18} />}
                            </button>
                            <button
                              onClick={() => openLoanForm(loan)}
                              className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
                              title="Edit Record"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => deleteLoan(loan.id)}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                              title="Delete Record"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Loan Form Modal */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? 'Edit Record' : 'Add New Record'}
              </h2>
              <button 
                onClick={() => setIsLoanModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleLoanFormSubmit} className="p-6 space-y-5">
              <div className="space-y-4">
                
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border cursor-pointer transition-all ${
                    formData.type === 'lent' 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="type" 
                      value="lent" 
                      checked={formData.type === 'lent'} 
                      onChange={handleInputChange} 
                      className="sr-only"
                    />
                    I Lent Money
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border cursor-pointer transition-all ${
                    formData.type === 'borrowed' 
                      ? 'bg-rose-50 border-rose-200 text-rose-700 font-medium' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                    <input 
                      type="radio" 
                      name="type" 
                      value="borrowed" 
                      checked={formData.type === 'borrowed'} 
                      onChange={handleInputChange} 
                      className="sr-only"
                    />
                    I Borrowed Money
                  </label>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                    <User size={16} className="text-slate-500" />
                    {formData.type === 'lent' ? 'Borrower Name' : 'Lender Name'}
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                    placeholder="e.g. John Doe or Bank"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      <Wallet size={16} className="text-slate-500" />
                      Principal Amount (₹)
                    </label>
                    <input
                      type="number"
                      name="principal"
                      required
                      min="0"
                      step="0.01"
                      value={formData.principal}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                      placeholder="50000"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      <Percent size={16} className="text-slate-500" />
                      Interest Rate (% APY)
                    </label>
                    <input
                      type="number"
                      name="rate"
                      required
                      min="0"
                      step="0.1"
                      value={formData.rate}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                      placeholder="10.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      <Calendar size={16} className="text-slate-500" />
                      Date Started
                    </label>
                    <input
                      type="date"
                      name="dateGiven"
                      required
                      value={formData.dateGiven}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                      <ArrowRightLeft size={16} className="text-slate-500" />
                      Estimated Return
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                    <FileText size={16} className="text-slate-500" />
                    Notes / Description
                  </label>
                  <textarea
                    name="note"
                    rows="2"
                    value={formData.note}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none shadow-sm"
                    placeholder="Optional details..."
                  ></textarea>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsLoanModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium transition-all shadow-md ${
                    formData.type === 'lent' 
                      ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' 
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                  }`}
                >
                  {editingId ? 'Save Changes' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Partial Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                Record Payment
              </h2>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handlePaymentFormSubmit} className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                    <Banknote size={16} className="text-emerald-600" />
                    Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="1"
                    step="0.01"
                    value={paymentFormData.amount}
                    onChange={handlePaymentInputChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
                    placeholder="5000"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1.5">
                    <Calendar size={16} className="text-emerald-600" />
                    Date of Payment
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={paymentFormData.date}
                    onChange={handlePaymentInputChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-md shadow-emerald-200"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Transaction History Modal */}
      {isHistoryModalOpen && activeHistoryLoan && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <History size={20} className="text-indigo-600" />
                  Transaction Ledger
                </h2>
                <p className="text-sm text-slate-500 mt-1">{activeHistoryLoan.name} • {activeHistoryLoan.rate}% APY</p>
              </div>
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
              <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
                {(() => {
                  const metrics = calculateLoanMetrics(activeHistoryLoan);
                  return metrics.history.map((event, index) => {
                    const isStart = event.type === 'start';
                    const isPayment = event.type === 'payment';
                    const isCurrent = event.type === 'current' || event.type === 'settled';
                    
                    return (
                      <div key={index} className="relative pl-6">
                        {/* Timeline dot */}
                        <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white ${
                          isStart ? 'bg-indigo-500' : isPayment ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}></div>
                        
                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-semibold text-slate-900">
                              {new Date(event.date).toLocaleDateString()}
                            </span>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              isStart ? 'bg-indigo-50 text-indigo-700' : 
                              isPayment ? 'bg-emerald-50 text-emerald-700' : 
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {isStart ? 'Principal Given' : isPayment ? 'Partial Payment' : event.type === 'settled' ? 'Settled Date' : 'Current Status'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100">
                            {isPayment ? (
                              <div>
                                <div className="text-xs text-slate-500">Amount Paid</div>
                                <div className="font-semibold text-emerald-600">-{formatCurrency(event.amount)}</div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-xs text-slate-500">Starting Amount</div>
                                <div className="font-semibold text-slate-900">{formatCurrency(event.amount)}</div>
                              </div>
                            )}
                            
                            {event.interestAccrued > 0 && (
                              <div>
                                <div className="text-xs text-slate-500">Interest Accrued Since Last</div>
                                <div className="font-semibold text-amber-600">+{formatCurrency(event.interestAccrued)}</div>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3 bg-slate-50 rounded-lg p-3 flex justify-between items-center border border-slate-100">
                            <span className="text-sm text-slate-600 font-medium">Balance Moving Forward:</span>
                            <span className="font-bold text-slate-900 text-lg">{formatCurrency(event.balanceAfter)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
               <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition-colors"
                >
                  Close Ledger
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
