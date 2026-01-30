'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bill, BillItem, Product } from '@/types';
import { Plus, Edit, Trash2, X, Printer, Download, Receipt, Search, Calendar } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';

interface BillingManagementProps {
  products: Product[];
}

export default function BillingManagement({ products }: BillingManagementProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('all');

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    paymentMethod: 'cash' as 'cash' | 'bank' | 'jazzcash' | 'card' | 'other',
    paymentStatus: 'paid' as 'paid' | 'pending' | 'partial',
    notes: '',
  });

  const [billItems, setBillItems] = useState<BillItem[]>([]);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const billsRef = collection(db, 'bills');
      const billsQuery = query(billsRef, orderBy('createdAt', 'desc'));
      const billsSnapshot = await getDocs(billsQuery);
      
      const billsData = billsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Bill[];

      setBills(billsData);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error('Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  const generateBillNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-4);
    return `GT-${year}${month}${day}-${time}`;
  };

  const addBillItem = () => {
    const newItem: BillItem = {
      id: Date.now().toString(),
      productName: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      subtotal: 0,
    };
    setBillItems([...billItems, newItem]);
  };

  const updateBillItem = (id: string, field: keyof BillItem, value: any) => {
    setBillItems(items => items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-calculate subtotal
        if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
          const quantity = field === 'quantity' ? value : updatedItem.quantity;
          const unitPrice = field === 'unitPrice' ? value : updatedItem.unitPrice;
          const discount = field === 'discount' ? value : updatedItem.discount;
          
          const subtotal = (quantity * unitPrice) - discount;
          updatedItem.subtotal = Math.max(0, subtotal);
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const removeBillItem = (id: string) => {
    setBillItems(items => items.filter(item => item.id !== id));
  };

  const selectProduct = (itemId: string, product: Product) => {
    updateBillItem(itemId, 'productId', product.id);
    updateBillItem(itemId, 'productName', product.name);
    updateBillItem(itemId, 'unitPrice', product.discountedPrice);
  };

  const calculateTotals = () => {
    const subtotal = billItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalDiscount = billItems.reduce((sum, item) => sum + item.discount, 0);
    const grandTotal = subtotal - totalDiscount;
    
    return { subtotal, totalDiscount, grandTotal };
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      notes: '',
    });
    setBillItems([]);
    setEditingBill(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (billItems.length === 0) {
      toast.error('Please add at least one item to the bill');
      return;
    }

    if (!formData.customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    setIsSubmitting(true);

    try {
      const { subtotal, totalDiscount, grandTotal } = calculateTotals();
      
      const billData = {
        billNumber: editingBill?.billNumber || generateBillNumber(),
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerAddress: formData.customerAddress,
        items: billItems,
        subtotal,
        totalDiscount,
        grandTotal,
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        notes: formData.notes,
        updatedAt: new Date(),
      };

      if (editingBill) {
        await updateDoc(doc(db, 'bills', editingBill.id), billData);
        toast.success('Bill updated successfully!');
      } else {
        await addDoc(collection(db, 'bills'), {
          ...billData,
          createdAt: new Date(),
        });
        toast.success('Bill created successfully!');
      }

      resetForm();
      fetchBills();
    } catch (error) {
      console.error('Error saving bill:', error);
      toast.error('Failed to save bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill);
    setFormData({
      customerName: bill.customerName,
      customerPhone: bill.customerPhone,
      customerAddress: bill.customerAddress || '',
      paymentMethod: bill.paymentMethod || 'cash',
      paymentStatus: bill.paymentStatus,
      notes: bill.notes || '',
    });
    setBillItems(bill.items);
    setShowForm(true);
  };

  const handleDelete = async (bill: Bill) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;

    try {
      await deleteDoc(doc(db, 'bills', bill.id));
      toast.success('Bill deleted successfully!');
      fetchBills();
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast.error('Failed to delete bill');
    }
  };

  const printBill = (bill: Bill) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${bill.billNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: bold; color: #333; }
            .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .customer-info, .invoice-info { width: 48%; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f5f5f5; font-weight: bold; }
            .totals { text-align: right; margin-top: 20px; }
            .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Glasgow Turbo House</div>
            <div>Professional Turbo Solutions</div>
          </div>
          
          <div class="invoice-details">
            <div class="customer-info">
              <h3>Bill To:</h3>
              <p><strong>${bill.customerName}</strong></p>
              <p>Phone: ${bill.customerPhone}</p>
              ${bill.customerAddress ? `<p>Address: ${bill.customerAddress}</p>` : ''}
            </div>
            <div class="invoice-info">
              <h3>Invoice Details:</h3>
              <p><strong>Invoice #:</strong> ${bill.billNumber}</p>
              <p><strong>Date:</strong> ${bill.createdAt.toLocaleDateString()}</p>
              <p><strong>Payment:</strong> ${bill.paymentStatus.toUpperCase()}</p>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>PKR ${item.unitPrice.toLocaleString()}</td>
                  <td>PKR ${item.discount.toLocaleString()}</td>
                  <td>PKR ${item.subtotal.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>PKR ${bill.subtotal.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span>Total Discount:</span>
              <span>PKR ${bill.totalDiscount.toLocaleString()}</span>
            </div>
            <div class="total-row grand-total">
              <span>Grand Total:</span>
              <span>PKR ${bill.grandTotal.toLocaleString()}</span>
            </div>
          </div>

          ${bill.notes ? `<div style="margin-top: 20px;"><strong>Notes:</strong> ${bill.notes}</div>` : ''}

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Glasgow Turbo House - Your Trusted Turbo Partner</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.customerPhone.includes(searchTerm);
    
    if (selectedDateRange === 'all') return matchesSearch;
    
    const billDate = new Date(bill.createdAt);
    const now = new Date();
    
    switch (selectedDateRange) {
      case 'today':
        return matchesSearch && billDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return matchesSearch && billDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return matchesSearch && billDate >= monthAgo;
      default:
        return matchesSearch;
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Billing Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Bill</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="input-field pl-10 w-full"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          <div className="text-sm text-gray-600 flex items-center">
            Total Bills: {filteredBills.length}
          </div>
        </div>
      </div>

      {/* Bills List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Mobile Cards View */}
        <div className="block sm:hidden">
          <div className="divide-y divide-gray-200">
            {filteredBills.map((bill) => (
              <div key={bill.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">{bill.billNumber}</div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    bill.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                    bill.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {bill.paymentStatus}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <div>{bill.customerName}</div>
                  <div>{bill.customerPhone}</div>
                  <div>PKR {bill.grandTotal.toLocaleString()}</div>
                  <div>{bill.createdAt.toLocaleDateString()}</div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => printBill(bill)}
                    className="text-blue-600 hover:text-blue-900 p-1"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(bill)}
                    className="text-green-600 hover:text-green-900 p-1"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(bill)}
                    className="text-red-600 hover:text-red-900 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bill Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBills.map((bill) => (
                <tr key={bill.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{bill.billNumber}</div>
                    <div className="text-sm text-gray-500">{bill.createdAt.toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{bill.customerName}</div>
                    <div className="text-sm text-gray-500">{bill.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      PKR {bill.grandTotal.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {bill.items.length} item(s)
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      bill.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                      bill.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {bill.paymentStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => printBill(bill)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Print Bill"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(bill)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit Bill"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(bill)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Bill"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBills.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Receipt className="h-12 w-12 text-gray-300 mb-4 mx-auto" />
            <p className="text-base font-medium">No bills found</p>
            <p className="text-sm">Create your first bill to get started</p>
          </div>
        )}
      </div>

      {/* Bill Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold">
                  {editingBill ? 'Edit Bill' : 'Create New Bill'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                      className="input-field w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.customerPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                      className="input-field w-full"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.customerAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                      className="input-field w-full"
                    />
                  </div>
                </div>

                {/* Bill Items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Bill Items</h4>
                    <button
                      type="button"
                      onClick={addBillItem}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Item</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {billItems.map((item, index) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                          <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Product/Item *
                            </label>
                            <div className="space-y-2">
                              <input
                                type="text"
                                required
                                value={item.productName}
                                onChange={(e) => updateBillItem(item.id, 'productName', e.target.value)}
                                className="input-field w-full"
                                placeholder="Enter product name"
                              />
                              <select
                                onChange={(e) => {
                                  const product = products.find(p => p.id === e.target.value);
                                  if (product) selectProduct(item.id, product);
                                }}
                                className="input-field w-full text-sm"
                              >
                                <option value="">Or select from products</option>
                                {products.map(product => (
                                  <option key={product.id} value={product.id}>
                                    {product.name} - PKR {product.discountedPrice.toLocaleString()}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateBillItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                              className="input-field w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Unit Price *
                            </label>
                            <input
                              type="number"
                              required
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => updateBillItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="input-field w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Discount
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={item.discount}
                              onChange={(e) => updateBillItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                              className="input-field w-full"
                            />
                          </div>

                          <div className="flex items-end">
                            <div className="w-full">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subtotal
                              </label>
                              <div className="input-field w-full bg-gray-50">
                                PKR {item.subtotal.toLocaleString()}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeBillItem(item.id)}
                              className="ml-2 text-red-600 hover:text-red-900 p-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {billItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Receipt className="h-12 w-12 text-gray-300 mb-4 mx-auto" />
                      <p>No items added yet</p>
                      <p className="text-sm">Click "Add Item" to start building your bill</p>
                    </div>
                  )}
                </div>

                {/* Bill Totals */}
                {billItems.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>PKR {calculateTotals().subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Discount:</span>
                        <span>PKR {calculateTotals().totalDiscount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-lg font-semibold border-t pt-2">
                        <span>Grand Total:</span>
                        <span>PKR {calculateTotals().grandTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                      className="input-field w-full"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="jazzcash">JazzCash</option>
                      <option value="card">Card</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Status
                    </label>
                    <select
                      value={formData.paymentStatus}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value as any }))}
                      className="input-field w-full"
                    >
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="partial">Partial</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Additional notes or terms..."
                  />
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || billItems.length === 0}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingBill ? 'Update Bill' : 'Create Bill'}</span>
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