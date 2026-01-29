'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FinancialTransaction, FinancialSummary } from '@/types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  Receipt,
  PieChart,
  BarChart3,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  FileText,
  CheckSquare,
  Square,
  MoreHorizontal,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import { 
  calculateFinancialSummary, 
  generateMonthlyReports, 
  getDefaultCategories,
  formatCurrency,
  getTransactionColor,
  getTransactionBgColor,
  calculateCashFlowTrend,
  exportTransactionsToCSV,
  exportMonthlyReportToCSV,
  exportCategoryReportToCSV,
  sortTransactions,
  filterTransactions
} from '@/lib/financial';

interface FinancialManagementProps {
  transactions: FinancialTransaction[];
  onTransactionsChange: () => void;
}

export default function FinancialManagement({ 
  transactions, 
  onTransactionsChange 
}: FinancialManagementProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'reports'>('overview');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredTransactions, setFilteredTransactions] = useState<FinancialTransaction[]>(transactions);
  
  // Advanced filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [filterPerson, setFilterPerson] = useState('');
  
  // Sorting states
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // UI states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);

  // Transaction form data
  const [transactionFormData, setTransactionFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    category: '',
    subcategory: '',
    amount: 0,
    description: '',
    paymentMethod: 'cash' as 'cash' | 'bank' | 'jazzcash' | 'easypaisa' | 'card' | 'other',
    transactionDate: new Date().toISOString().split('T')[0],
    fromPerson: '',
    toPerson: '',
    reference: '',
    notes: '',
    tags: [] as string[]
  });

  const categories = getDefaultCategories();

  // Update filtered transactions with advanced filtering and sorting
  useEffect(() => {
    const filters = {
      searchTerm,
      type: filterType,
      category: filterCategory !== 'all' ? filterCategory : undefined,
      paymentMethod: filterPaymentMethod !== 'all' ? filterPaymentMethod : undefined,
      dateRange,
      startDate: customStartDate ? new Date(customStartDate) : undefined,
      endDate: customEndDate ? new Date(customEndDate) : undefined,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      person: filterPerson
    };

    let filtered = filterTransactions(transactions, filters);
    filtered = sortTransactions(filtered, sortBy, sortOrder);
    
    setFilteredTransactions(filtered);
  }, [
    transactions, 
    searchTerm, 
    filterType, 
    filterCategory, 
    filterPaymentMethod,
    dateRange, 
    customStartDate, 
    customEndDate,
    minAmount, 
    maxAmount, 
    filterPerson,
    sortBy, 
    sortOrder
  ]);

  // Calculate financial summary
  useEffect(() => {
    const summary = calculateFinancialSummary(transactions);
    setFinancialSummary(summary);
  }, [transactions]);

  const resetTransactionForm = () => {
    setTransactionFormData({
      type: 'expense',
      category: '',
      subcategory: '',
      amount: 0,
      description: '',
      paymentMethod: 'cash',
      transactionDate: new Date().toISOString().split('T')[0],
      fromPerson: '',
      toPerson: '',
      reference: '',
      notes: '',
      tags: []
    });
    setEditingTransaction(null);
    setShowTransactionForm(false);
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Form data before validation:', transactionFormData);

      // Validation
      if (!transactionFormData.category.trim()) {
        toast.error('Please select a category');
        setIsSubmitting(false);
        return;
      }

      if (!transactionFormData.description.trim()) {
        toast.error('Please enter a description');
        setIsSubmitting(false);
        return;
      }

      if (transactionFormData.amount <= 0) {
        toast.error('Amount must be greater than 0');
        setIsSubmitting(false);
        return;
      }

      const transactionData = {
        type: transactionFormData.type,
        category: transactionFormData.category.trim(),
        subcategory: transactionFormData.subcategory.trim() || undefined,
        amount: transactionFormData.amount,
        description: transactionFormData.description.trim(),
        paymentMethod: transactionFormData.paymentMethod,
        transactionDate: new Date(transactionFormData.transactionDate),
        fromPerson: transactionFormData.fromPerson.trim() || undefined,
        toPerson: transactionFormData.toPerson.trim() || undefined,
        reference: transactionFormData.reference.trim() || undefined,
        notes: transactionFormData.notes.trim() || undefined,
        tags: transactionFormData.tags.filter(tag => tag.trim()),
        isRecurring: false,
        updatedAt: new Date(),
      };

      // Remove undefined values to prevent Firebase errors
      const cleanTransactionData = Object.fromEntries(
        Object.entries(transactionData).filter(([_, value]) => value !== undefined)
      );

      console.log('Transaction data to save:', cleanTransactionData);

      if (editingTransaction) {
        await updateDoc(doc(db, 'financialTransactions', editingTransaction.id), cleanTransactionData);
        toast.success('Transaction updated successfully!');
      } else {
        const docRef = await addDoc(collection(db, 'financialTransactions'), {
          ...cleanTransactionData,
          createdAt: new Date(),
        });
        console.log('Document written with ID: ', docRef.id);
        toast.success('Transaction added successfully!');
      }

      resetTransactionForm();
      onTransactionsChange();
    } catch (error) {
      console.error('Error saving transaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to save transaction: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteDoc(doc(db, 'financialTransactions', transactionId));
        toast.success('Transaction deleted successfully!');
        onTransactionsChange();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        toast.error('Failed to delete transaction.');
      }
    }
  };

  const editTransaction = (transaction: FinancialTransaction) => {
    setTransactionFormData({
      type: transaction.type,
      category: transaction.category,
      subcategory: transaction.subcategory || '',
      amount: transaction.amount,
      description: transaction.description,
      paymentMethod: transaction.paymentMethod,
      transactionDate: transaction.transactionDate.toISOString().split('T')[0],
      fromPerson: transaction.fromPerson || '',
      toPerson: transaction.toPerson || '',
      reference: transaction.reference || '',
      notes: transaction.notes || '',
      tags: transaction.tags || []
    });
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  };

  const cashFlowTrend = calculateCashFlowTrend(transactions);

  // Export functions
  const handleExportTransactions = () => {
    exportTransactionsToCSV(filteredTransactions, 'filtered_transactions');
  };

  const handleExportMonthlyReport = (month: number, year: number) => {
    exportMonthlyReportToCSV(transactions, month, year);
  };

  const handleExportCategoryReport = () => {
    exportCategoryReportToCSV(transactions);
  };

  // Bulk actions
  const toggleTransactionSelection = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId) 
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(filteredTransactions.map(t => t.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTransactions.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedTransactions.length} transactions?`)) {
      try {
        await Promise.all(
          selectedTransactions.map(id => deleteDoc(doc(db, 'financialTransactions', id)))
        );
        toast.success(`${selectedTransactions.length} transactions deleted successfully!`);
        setSelectedTransactions([]);
        onTransactionsChange();
      } catch (error) {
        console.error('Error deleting transactions:', error);
        toast.error('Failed to delete some transactions.');
      }
    }
  };

  const handleBulkExport = () => {
    const selectedTransactionData = filteredTransactions.filter(t => 
      selectedTransactions.includes(t.id)
    );
    exportTransactionsToCSV(selectedTransactionData, 'selected_transactions');
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterCategory('all');
    setFilterPaymentMethod('all');
    setDateRange('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setFilterPerson('');
    setSortBy('date');
    setSortOrder('desc');
  };

  // Get unique payment methods for filter
  const paymentMethods = Array.from(new Set(transactions.map(t => t.paymentMethod)));
  const uniquePersons = Array.from(new Set([
    ...transactions.map(t => t.fromPerson).filter(Boolean),
    ...transactions.map(t => t.toPerson).filter(Boolean)
  ])) as string[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Financial Management</h2>
          <p className="text-sm sm:text-base text-gray-600">Track your income, expenses, and cash flow</p>
        </div>
        <button
          onClick={() => setShowTransactionForm(true)}
          className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: PieChart },
            { id: 'transactions', label: 'Transactions', icon: Receipt },
            { id: 'reports', label: 'Reports', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1 sm:space-x-2 py-2 px-3 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
                <span className="xs:hidden sm:hidden">{tab.label.charAt(0)}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Advanced Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filters & Search</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="btn-secondary flex items-center space-x-2 text-xs sm:text-sm"
                >
                  {showAdvancedFilters ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                  <span className="hidden sm:inline">{showAdvancedFilters ? 'Hide' : 'Show'} Advanced</span>
                  <span className="sm:hidden">{showAdvancedFilters ? 'Hide' : 'Show'}</span>
                </button>
                <button
                  onClick={clearAllFilters}
                  className="btn-secondary flex items-center space-x-2 text-xs sm:text-sm"
                >
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Clear All</span>
                  <span className="sm:hidden">Clear</span>
                </button>
              </div>
            </div>

            {/* Basic Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search transactions..."
                  className="input-field pl-8 sm:pl-10 text-sm"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="input-field text-sm"
              >
                <option value="all">All Types</option>
                <option value="income">Income Only</option>
                <option value="expense">Expenses Only</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="input-field text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.name} value={category.name}>
                    <span className="hidden sm:inline">{category.icon} </span>{category.name}
                  </option>
                ))}
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="input-field text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 3 Months</option>
                <option value="year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <select
                    value={filterPaymentMethod}
                    onChange={(e) => setFilterPaymentMethod(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="all">All Payment Methods</option>
                    {paymentMethods.map(method => (
                      <option key={method} value={method} className="capitalize">
                        {method}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={filterPerson}
                    onChange={(e) => setFilterPerson(e.target.value)}
                    placeholder="Filter by person name..."
                    className="input-field text-sm"
                    list="persons-list"
                  />
                  <datalist id="persons-list">
                    {uniquePersons.map(person => (
                      <option key={person} value={person} />
                    ))}
                  </datalist>

                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      placeholder="Min amount"
                      className="input-field text-sm"
                    />
                    <input
                      type="number"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      placeholder="Max amount"
                      className="input-field text-sm"
                    />
                  </div>
                </div>

                {/* Custom Date Range */}
                {dateRange === 'custom' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results Summary & Actions */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Transactions ({filteredTransactions.length})
                </h3>
                {selectedTransactions.length > 0 && (
                  <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs sm:text-sm">
                    {selectedTransactions.length} selected
                  </span>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                {/* Sorting */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as any);
                    setSortOrder(order as any);
                  }}
                  className="input-field text-xs sm:text-sm"
                >
                  <option value="date-desc">Latest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="amount-desc">Highest Amount</option>
                  <option value="amount-asc">Lowest Amount</option>
                  <option value="category-asc">Category A-Z</option>
                  <option value="category-desc">Category Z-A</option>
                  <option value="type-asc">Type A-Z</option>
                </select>

                {/* Bulk Actions */}
                {selectedTransactions.length > 0 && (
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <button
                      onClick={handleBulkExport}
                      className="btn-secondary flex items-center justify-center space-x-2 text-xs sm:text-sm"
                    >
                      <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>Export Selected</span>
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="btn-danger flex items-center justify-center space-x-2 text-xs sm:text-sm"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>Delete Selected</span>
                    </button>
                  </div>
                )}

                {/* Export All */}
                <button
                  onClick={handleExportTransactions}
                  className="btn-secondary flex items-center justify-center space-x-2 text-xs sm:text-sm"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Export All</span>
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-green-600 font-medium">Total Income</p>
                <p className="text-sm sm:text-xl font-bold text-green-700">
                  {formatCurrency(filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0))}
                </p>
              </div>
              <div className="bg-red-50 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-red-600 font-medium">Total Expenses</p>
                <p className="text-sm sm:text-xl font-bold text-red-700">
                  {formatCurrency(filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0))}
                </p>
              </div>
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-600 font-medium">Net Amount</p>
                <p className="text-sm sm:text-xl font-bold text-blue-700">
                  {formatCurrency(
                    filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) -
                    filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
                  )}
                </p>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Average Amount</p>
                <p className="text-sm sm:text-xl font-bold text-gray-700">
                  {formatCurrency(
                    filteredTransactions.length > 0 
                      ? filteredTransactions.reduce((sum, t) => sum + t.amount, 0) / filteredTransactions.length
                      : 0
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={toggleSelectAll}
                        className="flex items-center space-x-2"
                      >
                        {selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0 ? (
                          <CheckSquare className="h-4 w-4 text-primary-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Person
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleTransactionSelection(transaction.id)}
                          >
                            {selectedTransactions.includes(transaction.id) ? (
                              <CheckSquare className="h-4 w-4 text-primary-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.transactionDate.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            {transaction.reference && (
                              <p className="text-xs text-gray-500">Ref: {transaction.reference}</p>
                            )}
                            {transaction.notes && (
                              <p className="text-xs text-gray-500 mt-1">{transaction.notes}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <p>{transaction.category}</p>
                            {transaction.subcategory && (
                              <p className="text-xs text-gray-500">{transaction.subcategory}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type === 'income' ? 'Income' : 'Expense'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={getTransactionColor(transaction.type)}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {transaction.paymentMethod}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.type === 'income' ? transaction.fromPerson : transaction.toPerson}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => editTransaction(transaction)}
                              className="text-primary-600 hover:text-primary-900"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteTransaction(transaction.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <FileText className="h-12 w-12 text-gray-300 mb-4" />
                          <p className="text-lg font-medium">No transactions found</p>
                          <p className="text-sm">Try adjusting your filters or add a new transaction</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden">
              {/* Select All Mobile */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700"
                >
                  {selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-primary-600" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                  <span>Select All ({filteredTransactions.length})</span>
                </button>
              </div>

              {filteredTransactions.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <div key={transaction.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleTransactionSelection(transaction.id)}
                          >
                            {selectedTransactions.includes(transaction.id) ? (
                              <CheckSquare className="h-4 w-4 text-primary-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{transaction.description}</p>
                            <p className="text-xs text-gray-500">{transaction.transactionDate.toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => editTransaction(transaction)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteTransaction(transaction.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Category</p>
                          <p className="font-medium">{transaction.category}</p>
                          {transaction.subcategory && (
                            <p className="text-xs text-gray-500">{transaction.subcategory}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-500">Amount</p>
                          <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Type</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type === 'income' ? 'Income' : 'Expense'}
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-500">Payment</p>
                          <p className="font-medium capitalize">{transaction.paymentMethod}</p>
                        </div>
                        {(transaction.fromPerson || transaction.toPerson) && (
                          <div className="col-span-2">
                            <p className="text-gray-500">
                              {transaction.type === 'income' ? 'From' : 'To'}
                            </p>
                            <p className="font-medium">
                              {transaction.type === 'income' ? transaction.fromPerson : transaction.toPerson}
                            </p>
                          </div>
                        )}
                        {transaction.reference && (
                          <div className="col-span-2">
                            <p className="text-gray-500">Reference</p>
                            <p className="font-medium text-xs">{transaction.reference}</p>
                          </div>
                        )}
                        {transaction.notes && (
                          <div className="col-span-2">
                            <p className="text-gray-500">Notes</p>
                            <p className="text-xs text-gray-700">{transaction.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="h-12 w-12 text-gray-300 mb-4 mx-auto" />
                  <p className="text-base font-medium">No transactions found</p>
                  <p className="text-sm">Try adjusting your filters or add a new transaction</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Monthly Reports */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Financial Reports</h3>
              <button
                onClick={handleExportCategoryReport}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export Category Report</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {generateMonthlyReports(transactions, 6).map((report, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">
                      {report.month} {report.year}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <div className={`flex items-center space-x-1 ${
                        report.cashFlowTrend === 'positive' ? 'text-green-600' :
                        report.cashFlowTrend === 'negative' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {report.cashFlowTrend === 'positive' ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : report.cashFlowTrend === 'negative' ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : (
                          <Calendar className="h-4 w-4" />
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const monthIndex = new Date(`${report.month} 1, ${report.year}`).getMonth();
                          handleExportMonthlyReport(monthIndex, report.year);
                        }}
                        className="text-primary-600 hover:text-primary-900"
                        title="Export this month"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Income:</span>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(report.totalIncome)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Expenses:</span>
                      <span className="text-sm font-medium text-red-600">
                        {formatCurrency(report.totalExpenses)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium text-gray-900">Net Profit:</span>
                      <span className={`text-sm font-bold ${
                        report.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(report.netProfit)}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                      <p>📊 Transactions: {report.transactionCount}</p>
                      <p>💰 Top Income: {report.topIncomeSource}</p>
                      <p>💸 Top Expense: {report.topExpenseCategory}</p>
                    </div>

                    {/* Progress bars for visual representation */}
                    <div className="mt-3 space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Income vs Expenses</span>
                          <span>{report.totalIncome > 0 ? Math.round((report.totalIncome / (report.totalIncome + report.totalExpenses)) * 100) : 0}% income</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ 
                              width: `${report.totalIncome > 0 ? (report.totalIncome / (report.totalIncome + report.totalExpenses)) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cash Flow Analysis */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Cash Flow Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${
                  cashFlowTrend.trend === 'positive' ? 'bg-green-100' :
                  cashFlowTrend.trend === 'negative' ? 'bg-red-100' :
                  'bg-gray-100'
                }`}>
                  {cashFlowTrend.trend === 'positive' ? (
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  ) : cashFlowTrend.trend === 'negative' ? (
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  ) : (
                    <Calendar className="h-8 w-8 text-gray-600" />
                  )}
                </div>
                <h4 className="font-semibold text-gray-900">30-Day Trend</h4>
                <p className={`text-2xl font-bold ${
                  cashFlowTrend.trend === 'positive' ? 'text-green-600' :
                  cashFlowTrend.trend === 'negative' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {cashFlowTrend.trend === 'positive' ? '+' : cashFlowTrend.trend === 'negative' ? '-' : ''}
                  {cashFlowTrend.percentage}%
                </p>
                <p className="text-sm text-gray-500 capitalize">{cashFlowTrend.trend}</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Net Cash Flow</h4>
                <p className={`text-2xl font-bold ${
                  cashFlowTrend.amount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(Math.abs(cashFlowTrend.amount))}
                </p>
                <p className="text-sm text-gray-500">Last 30 days</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Total Transactions</h4>
                <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
                <p className="text-sm text-gray-500">All time</p>
              </div>
            </div>
          </div>

          {/* Category Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Income Categories */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Income Categories</h3>
              <div className="space-y-3">
                {financialSummary?.topIncomeCategories.slice(0, 8).map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-gray-900">{category.category}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(category.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {category.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )) || <p className="text-gray-500 text-center py-4">No income recorded yet</p>}
              </div>
            </div>

            {/* Top Expense Categories */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Expense Categories</h3>
              <div className="space-y-3">
                {financialSummary?.topExpenseCategories.slice(0, 8).map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-gray-900">{category.category}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(category.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {category.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )) || <p className="text-gray-500 text-center py-4">No expenses recorded yet</p>}
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={handleExportTransactions}
                className="btn-secondary flex items-center justify-center space-x-2 p-4"
              >
                <Download className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">All Transactions</p>
                  <p className="text-xs text-gray-500">Complete transaction history</p>
                </div>
              </button>
              
              <button 
                onClick={() => {
                  const currentMonth = new Date().getMonth();
                  const currentYear = new Date().getFullYear();
                  handleExportMonthlyReport(currentMonth, currentYear);
                }}
                className="btn-secondary flex items-center justify-center space-x-2 p-4"
              >
                <Calendar className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">This Month</p>
                  <p className="text-xs text-gray-500">Current month transactions</p>
                </div>
              </button>
              
              <button 
                onClick={handleExportCategoryReport}
                className="btn-secondary flex items-center justify-center space-x-2 p-4"
              >
                <PieChart className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">Category Report</p>
                  <p className="text-xs text-gray-500">Breakdown by categories</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && financialSummary && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Income */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <ArrowUpCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Income</p>
                  <p className="text-2xl font-semibold text-green-600">
                    {formatCurrency(financialSummary.totalIncome)}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Expenses */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <ArrowDownCircle className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                  <p className="text-2xl font-semibold text-red-600">
                    {formatCurrency(financialSummary.totalExpenses)}
                  </p>
                </div>
              </div>
            </div>

            {/* Net Balance */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    financialSummary.netBalance >= 0 ? 'bg-blue-100' : 'bg-red-100'
                  }`}>
                    <DollarSign className={`h-5 w-5 ${
                      financialSummary.netBalance >= 0 ? 'text-blue-600' : 'text-red-600'
                    }`} />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Net Balance</p>
                  <p className={`text-2xl font-semibold ${
                    financialSummary.netBalance >= 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(financialSummary.netBalance)}
                  </p>
                </div>
              </div>
            </div>

            {/* Monthly Balance */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    cashFlowTrend.trend === 'positive' ? 'bg-green-100' : 
                    cashFlowTrend.trend === 'negative' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    {cashFlowTrend.trend === 'positive' ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : cashFlowTrend.trend === 'negative' ? (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    ) : (
                      <Calendar className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">This Month</p>
                  <p className={`text-2xl font-semibold ${
                    financialSummary.monthlyBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(financialSummary.monthlyBalance)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Income Categories */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Income Sources</h3>
              <div className="space-y-3">
                {financialSummary.topIncomeCategories.length > 0 ? (
                  financialSummary.topIncomeCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-gray-900">{category.category}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(category.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {category.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No income recorded yet</p>
                )}
              </div>
            </div>

            {/* Top Expense Categories */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Expense Categories</h3>
              <div className="space-y-3">
                {financialSummary.topExpenseCategories.length > 0 ? (
                  financialSummary.topExpenseCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-gray-900">{category.category}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(category.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {category.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No expenses recorded yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {financialSummary.recentTransactions.length > 0 ? (
                financialSummary.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        getTransactionBgColor(transaction.type)
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-xs text-gray-500">{transaction.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaction.transactionDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No transactions yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold">
                  {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
                </h2>
                <button
                  onClick={resetTransactionForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              <form onSubmit={handleTransactionSubmit} className="space-y-4 sm:space-y-6">
                {/* Transaction Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Type *
                  </label>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="income"
                        checked={transactionFormData.type === 'income'}
                        onChange={(e) => setTransactionFormData(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                        className="mr-2"
                      />
                      <span className="text-green-600 font-medium text-sm sm:text-base">Income (Money In)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="expense"
                        checked={transactionFormData.type === 'expense'}
                        onChange={(e) => setTransactionFormData(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
                        className="mr-2"
                      />
                      <span className="text-red-600 font-medium text-sm sm:text-base">Expense (Money Out)</span>
                    </label>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={transactionFormData.category}
                      onChange={(e) => setTransactionFormData(prev => ({ ...prev, category: e.target.value }))}
                      required
                      className="input-field text-sm"
                    >
                      <option value="">Select category</option>
                      {categories
                        .filter(cat => cat.type === transactionFormData.type || cat.type === 'both')
                        .map(category => (
                          <option key={category.name} value={category.name}>
                            <span className="hidden sm:inline">{category.icon} </span>{category.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (PKR) *
                    </label>
                    <input
                      type="number"
                      value={transactionFormData.amount}
                      onChange={(e) => setTransactionFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      required
                      min="0"
                      step="0.01"
                      className="input-field text-sm"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={transactionFormData.description}
                      onChange={(e) => setTransactionFormData(prev => ({ ...prev, description: e.target.value }))}
                      required
                      className="input-field text-sm"
                      placeholder="What was this transaction for?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={transactionFormData.transactionDate}
                      onChange={(e) => setTransactionFormData(prev => ({ ...prev, transactionDate: e.target.value }))}
                      required
                      className="input-field text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={transactionFormData.paymentMethod}
                      onChange={(e) => setTransactionFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                      className="input-field text-sm"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="jazzcash">JazzCash</option>
                      <option value="easypaisa">EasyPaisa</option>
                      <option value="card">Card</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {transactionFormData.type === 'income' ? 'From Person' : 'To Person'}
                    </label>
                    <input
                      type="text"
                      value={transactionFormData.type === 'income' ? transactionFormData.fromPerson : transactionFormData.toPerson}
                      onChange={(e) => setTransactionFormData(prev => ({ 
                        ...prev, 
                        [transactionFormData.type === 'income' ? 'fromPerson' : 'toPerson']: e.target.value 
                      }))}
                      className="input-field text-sm"
                      placeholder={transactionFormData.type === 'income' ? 'Who paid you?' : 'Who did you pay?'}
                    />
                  </div>
                </div>

                {/* Additional Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference/Receipt #
                    </label>
                    <input
                      type="text"
                      value={transactionFormData.reference}
                      onChange={(e) => setTransactionFormData(prev => ({ ...prev, reference: e.target.value }))}
                      className="input-field text-sm"
                      placeholder="Invoice number, receipt number, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subcategory
                    </label>
                    <input
                      type="text"
                      value={transactionFormData.subcategory}
                      onChange={(e) => setTransactionFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                      className="input-field text-sm"
                      placeholder="Optional subcategory"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={transactionFormData.notes}
                    onChange={(e) => setTransactionFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="input-field text-sm"
                    placeholder="Additional notes about this transaction..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={resetTransactionForm}
                    className="btn-secondary w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        {editingTransaction ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      editingTransaction ? 'Update Transaction' : 'Add Transaction'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}