import { FinancialTransaction, FinancialSummary, MonthlyFinancialReport } from '@/types';

/**
 * Calculate financial summary from transactions
 */
export const calculateFinancialSummary = (transactions: FinancialTransaction[]): FinancialSummary => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpenses;

  // Calculate monthly figures
  const monthlyTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.transactionDate);
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  });

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyBalance = monthlyIncome - monthlyExpenses;

  // Calculate category breakdowns
  const incomeByCategory = new Map<string, number>();
  const expensesByCategory = new Map<string, number>();

  transactions.forEach(transaction => {
    if (transaction.type === 'income') {
      const current = incomeByCategory.get(transaction.category) || 0;
      incomeByCategory.set(transaction.category, current + transaction.amount);
    } else {
      const current = expensesByCategory.get(transaction.category) || 0;
      expensesByCategory.set(transaction.category, current + transaction.amount);
    }
  });

  // Top income categories
  const topIncomeCategories = Array.from(incomeByCategory.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Top expense categories
  const topExpenseCategories = Array.from(expensesByCategory.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Recent transactions (last 10)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    .slice(0, 10);

  // Upcoming recurring transactions
  const upcomingRecurring = transactions
    .filter(t => t.isRecurring)
    .slice(0, 5);

  return {
    totalIncome,
    totalExpenses,
    netBalance,
    currentCashFlow: netBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyBalance,
    topIncomeCategories,
    topExpenseCategories,
    recentTransactions,
    upcomingRecurring
  };
};

/**
 * Generate monthly financial reports
 */
export const generateMonthlyReports = (transactions: FinancialTransaction[], months: number = 6): MonthlyFinancialReport[] => {
  const reports: MonthlyFinancialReport[] = [];
  const currentDate = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const reportDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const month = reportDate.toLocaleDateString('en-US', { month: 'long' });
    const year = reportDate.getFullYear();

    // Filter transactions for this month
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transactionDate);
      return transactionDate.getMonth() === reportDate.getMonth() && 
             transactionDate.getFullYear() === reportDate.getFullYear();
    });

    const totalIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netProfit = totalIncome - totalExpenses;

    // Find top categories
    const incomeCategories = new Map<string, number>();
    const expenseCategories = new Map<string, number>();

    monthTransactions.forEach(t => {
      if (t.type === 'income') {
        incomeCategories.set(t.category, (incomeCategories.get(t.category) || 0) + t.amount);
      } else {
        expenseCategories.set(t.category, (expenseCategories.get(t.category) || 0) + t.amount);
      }
    });

    const topIncomeSource = Array.from(incomeCategories.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

    const topExpenseCategory = Array.from(expenseCategories.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

    // Determine cash flow trend
    let cashFlowTrend: 'positive' | 'negative' | 'stable' = 'stable';
    if (netProfit > 1000) cashFlowTrend = 'positive';
    else if (netProfit < -1000) cashFlowTrend = 'negative';

    reports.push({
      month,
      year,
      totalIncome,
      totalExpenses,
      netProfit,
      transactionCount: monthTransactions.length,
      topIncomeSource,
      topExpenseCategory,
      cashFlowTrend
    });
  }

  return reports;
};

/**
 * Get default financial categories
 */
export const getDefaultCategories = () => {
  return [
    // Income Categories
    { name: 'Business Sales', type: 'income', color: '#10B981', icon: '💰' },
    { name: 'Turbo Sales', type: 'income', color: '#059669', icon: '🔧' },
    { name: 'Service Income', type: 'income', color: '#047857', icon: '⚙️' },
    { name: 'Investment Returns', type: 'income', color: '#065F46', icon: '📈' },
    { name: 'Other Income', type: 'income', color: '#064E3B', icon: '💵' },

    // Expense Categories
    { name: 'Business Expenses', type: 'expense', color: '#EF4444', icon: '🏢' },
    { name: 'Inventory Purchase', type: 'expense', color: '#DC2626', icon: '📦' },
    { name: 'Household', type: 'expense', color: '#B91C1C', icon: '🏠' },
    { name: 'Utilities', type: 'expense', color: '#991B1B', icon: '💡' },
    { name: 'Transportation', type: 'expense', color: '#7F1D1D', icon: '🚗' },
    { name: 'Food & Dining', type: 'expense', color: '#F59E0B', icon: '🍽️' },
    { name: 'Healthcare', type: 'expense', color: '#D97706', icon: '🏥' },
    { name: 'Education', type: 'expense', color: '#B45309', icon: '📚' },
    { name: 'Entertainment', type: 'expense', color: '#92400E', icon: '🎬' },
    { name: 'Other Expenses', type: 'expense', color: '#78350F', icon: '💸' }
  ];
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return `PKR ${amount.toLocaleString()}`;
};

/**
 * Get transaction color based on type
 */
export const getTransactionColor = (type: 'income' | 'expense'): string => {
  return type === 'income' ? 'text-green-600' : 'text-red-600';
};

/**
 * Get transaction background color based on type
 */
export const getTransactionBgColor = (type: 'income' | 'expense'): string => {
  return type === 'income' ? 'bg-green-50' : 'bg-red-50';
};

/**
 * Calculate cash flow trend
 */
export const calculateCashFlowTrend = (transactions: FinancialTransaction[], days: number = 30): {
  trend: 'positive' | 'negative' | 'stable';
  percentage: number;
  amount: number;
} => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const periodTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.transactionDate);
    return transactionDate >= startDate && transactionDate <= endDate;
  });

  const income = periodTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = periodTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netAmount = income - expenses;
  const totalAmount = income + expenses;
  const percentage = totalAmount > 0 ? Math.abs((netAmount / totalAmount) * 100) : 0;

  let trend: 'positive' | 'negative' | 'stable' = 'stable';
  if (netAmount > 1000) trend = 'positive';
  else if (netAmount < -1000) trend = 'negative';

  return {
    trend,
    percentage: Math.round(percentage),
    amount: netAmount
  };
};

/**
 * Export transactions to CSV
 */
export const exportTransactionsToCSV = (transactions: FinancialTransaction[], filename: string = 'transactions') => {
  const headers = [
    'Date',
    'Type',
    'Category',
    'Subcategory',
    'Description',
    'Amount (PKR)',
    'Payment Method',
    'From Person',
    'To Person',
    'Reference',
    'Notes'
  ];

  const csvData = transactions.map(t => [
    t.transactionDate.toLocaleDateString(),
    t.type,
    t.category,
    t.subcategory || '',
    t.description,
    t.amount.toString(),
    t.paymentMethod,
    t.fromPerson || '',
    t.toPerson || '',
    t.reference || '',
    t.notes || ''
  ]);

  const csvContent = [headers, ...csvData]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export monthly report to CSV
 */
export const exportMonthlyReportToCSV = (transactions: FinancialTransaction[], month: number, year: number) => {
  const monthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.transactionDate);
    return transactionDate.getMonth() === month && transactionDate.getFullYear() === year;
  });

  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long' });
  exportTransactionsToCSV(monthTransactions, `${monthName}_${year}_report`);
};

/**
 * Export category report to CSV
 */
export const exportCategoryReportToCSV = (transactions: FinancialTransaction[]) => {
  const incomeByCategory = new Map<string, { amount: number; count: number }>();
  const expensesByCategory = new Map<string, { amount: number; count: number }>();

  transactions.forEach(t => {
    if (t.type === 'income') {
      const current = incomeByCategory.get(t.category) || { amount: 0, count: 0 };
      incomeByCategory.set(t.category, {
        amount: current.amount + t.amount,
        count: current.count + 1
      });
    } else {
      const current = expensesByCategory.get(t.category) || { amount: 0, count: 0 };
      expensesByCategory.set(t.category, {
        amount: current.amount + t.amount,
        count: current.count + 1
      });
    }
  });

  const headers = ['Category', 'Type', 'Total Amount (PKR)', 'Transaction Count', 'Average Amount (PKR)'];
  const csvData: string[][] = [];

  // Add income categories
  Array.from(incomeByCategory.entries()).forEach(([category, data]) => {
    csvData.push([
      category,
      'Income',
      data.amount.toString(),
      data.count.toString(),
      Math.round(data.amount / data.count).toString()
    ]);
  });

  // Add expense categories
  Array.from(expensesByCategory.entries()).forEach(([category, data]) => {
    csvData.push([
      category,
      'Expense',
      data.amount.toString(),
      data.count.toString(),
      Math.round(data.amount / data.count).toString()
    ]);
  });

  const csvContent = [headers, ...csvData]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `category_report_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Sort transactions by various criteria
 */
export const sortTransactions = (
  transactions: FinancialTransaction[],
  sortBy: 'date' | 'amount' | 'category' | 'type',
  sortOrder: 'asc' | 'desc' = 'desc'
): FinancialTransaction[] => {
  return [...transactions].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison = new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime();
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
};

/**
 * Advanced filter for transactions
 */
export const filterTransactions = (
  transactions: FinancialTransaction[],
  filters: {
    searchTerm?: string;
    type?: 'all' | 'income' | 'expense';
    category?: string;
    paymentMethod?: string;
    dateRange?: 'all' | 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
    person?: string;
  }
): FinancialTransaction[] => {
  let filtered = [...transactions];

  // Search term filter
  if (filters.searchTerm?.trim()) {
    const searchLower = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(t => 
      t.description.toLowerCase().includes(searchLower) ||
      t.category.toLowerCase().includes(searchLower) ||
      t.subcategory?.toLowerCase().includes(searchLower) ||
      t.fromPerson?.toLowerCase().includes(searchLower) ||
      t.toPerson?.toLowerCase().includes(searchLower) ||
      t.reference?.toLowerCase().includes(searchLower) ||
      t.notes?.toLowerCase().includes(searchLower)
    );
  }

  // Type filter
  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter(t => t.type === filters.type);
  }

  // Category filter
  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter(t => t.category === filters.category);
  }

  // Payment method filter
  if (filters.paymentMethod && filters.paymentMethod !== 'all') {
    filtered = filtered.filter(t => t.paymentMethod === filters.paymentMethod);
  }

  // Date range filter
  if (filters.dateRange && filters.dateRange !== 'all') {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (filters.dateRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'custom':
        if (filters.startDate) startDate = filters.startDate;
        if (filters.endDate) endDate = filters.endDate;
        break;
    }

    filtered = filtered.filter(t => {
      const transactionDate = new Date(t.transactionDate);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }

  // Amount range filter
  if (filters.minAmount !== undefined) {
    filtered = filtered.filter(t => t.amount >= filters.minAmount!);
  }
  if (filters.maxAmount !== undefined) {
    filtered = filtered.filter(t => t.amount <= filters.maxAmount!);
  }

  // Person filter
  if (filters.person?.trim()) {
    const personLower = filters.person.toLowerCase();
    filtered = filtered.filter(t => 
      t.fromPerson?.toLowerCase().includes(personLower) ||
      t.toPerson?.toLowerCase().includes(personLower)
    );
  }

  return filtered;
};