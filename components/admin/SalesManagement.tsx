'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDocs 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Sale, SaleItem, Customer, Purchase } from '@/types';
import { Plus, Edit, Trash2, X, ShoppingBag, User, Phone, Calendar, DollarSign, Package } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import AdminSearchBar from './AdminSearchBar';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/utils';
import { getAvailableItems, checkItemStock } from '@/lib/inventory';

interface SalesManagementProps {
  sales: Sale[];
  customers: Customer[];
  purchases: Purchase[]; // Added purchases for inventory tracking
  onSalesChange: () => void;
  onCustomersChange: () => void;
}

export default function SalesManagement({ 
  sales, 
  customers, 
  purchases, // Added purchases
  onSalesChange, 
  onCustomersChange 
}: SalesManagementProps) {
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredSales, setFilteredSales] = useState<Sale[]>(sales);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'sales' | 'customers'>('sales');
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<string>('');

  // Sale form data
  const [saleFormData, setSaleFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerCity: '',
    saleDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash' as 'cash' | 'bank' | 'jazzcash' | 'other',
    notes: '',
    items: [{ itemName: '', quantity: 1, pricePerUnit: 0 }] as Omit<SaleItem, 'id' | 'totalPrice'>[]
  });

  // Customer form data
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: ''
  });

  // Update filtered sales when sales or search changes
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = sales.filter(sale => 
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customerPhone.includes(searchTerm) ||
        sale.customerCity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.items.some(item => item.itemName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        sale.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSales(filtered);
    } else {
      setFilteredSales(sales);
    }
  }, [sales, searchTerm]);

  // Calculate available inventory items
  useEffect(() => {
    const items = getAvailableItems(purchases, sales);
    setAvailableItems(items);
  }, [purchases, sales]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const sorted = [...filteredSales].sort((a, b) => {
      let aValue: any = a[sortBy as keyof Sale];
      let bValue: any = b[sortBy as keyof Sale];

      if (sortBy === 'saleDate' || sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    setFilteredSales(sorted);
  };

  const resetSaleForm = () => {
    setSaleFormData({
      customerId: '',
      customerName: '',
      customerPhone: '',
      customerCity: '',
      saleDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      notes: '',
      items: [{ itemName: '', quantity: 1, pricePerUnit: 0 }]
    });
    setEditingSale(null);
    setShowSaleForm(false);
  };

  const resetCustomerForm = () => {
    setCustomerFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      city: ''
    });
    setEditingCustomer(null);
    setShowCustomerForm(false);
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSaleFormData(prev => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerCity: customer.city || ''
      }));
    }
  };

  const addSaleItem = () => {
    setSaleFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemName: '', quantity: 1, pricePerUnit: 0 }]
    }));
  };

  const selectInventoryItem = (itemName: string, suggestedPrice: number, availableStock: number) => {
    const currentItems = [...saleFormData.items];
    const lastItemIndex = currentItems.length - 1;
    
    if (lastItemIndex >= 0 && !currentItems[lastItemIndex].itemName) {
      // Update the last empty item
      currentItems[lastItemIndex] = {
        itemName: itemName,
        quantity: 1,
        pricePerUnit: suggestedPrice
      };
      setSaleFormData(prev => ({ ...prev, items: currentItems }));
      setSelectedInventoryItem('');
      toast.success(`Added ${itemName} (${availableStock} available)`);
    } else {
      // Add new item
      setSaleFormData(prev => ({
        ...prev,
        items: [...prev.items, { itemName: itemName, quantity: 1, pricePerUnit: suggestedPrice }]
      }));
      setSelectedInventoryItem('');
      toast.success(`Added ${itemName} (${availableStock} available)`);
    }
  };

  const removeSaleItem = (index: number) => {
    setSaleFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateSaleItem = (index: number, field: keyof Omit<SaleItem, 'id' | 'totalPrice'>, value: any) => {
    setSaleFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTotalAmount = () => {
    return saleFormData.items.reduce((total, item) => 
      total + (item.quantity * item.pricePerUnit), 0
    );
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!saleFormData.customerId) {
        toast.error('Please select a customer');
        setIsSubmitting(false);
        return;
      }

      if (saleFormData.items.length === 0) {
        toast.error('Please add at least one item');
        setIsSubmitting(false);
        return;
      }

      // Validate items and check stock
      for (let i = 0; i < saleFormData.items.length; i++) {
        const item = saleFormData.items[i];
        if (!item.itemName.trim()) {
          toast.error(`Item ${i + 1}: Item name is required`);
          setIsSubmitting(false);
          return;
        }
        if (item.quantity <= 0) {
          toast.error(`Item ${i + 1}: Quantity must be greater than 0`);
          setIsSubmitting(false);
          return;
        }
        if (item.pricePerUnit <= 0) {
          toast.error(`Item ${i + 1}: Price per unit must be greater than 0`);
          setIsSubmitting(false);
          return;
        }

        // Check inventory stock
        const stockCheck = checkItemStock(item.itemName, item.quantity, purchases, sales);
        if (!stockCheck.available) {
          toast.error(`${item.itemName}: ${stockCheck.message}`);
          setIsSubmitting(false);
          return;
        }
      }

      const saleItems: SaleItem[] = saleFormData.items.map((item, index) => ({
        id: `item_${index}`,
        itemName: item.itemName.trim(),
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        totalPrice: item.quantity * item.pricePerUnit
      }));

      const saleData = {
        customerId: saleFormData.customerId,
        customerName: saleFormData.customerName,
        customerPhone: saleFormData.customerPhone,
        customerCity: saleFormData.customerCity || '',
        items: saleItems,
        totalAmount: calculateTotalAmount(),
        saleDate: new Date(saleFormData.saleDate),
        paymentMethod: saleFormData.paymentMethod,
        notes: saleFormData.notes.trim() || '',
        updatedAt: new Date(),
      };

      console.log('Attempting to save sale:', saleData);

      if (editingSale) {
        await updateDoc(doc(db, 'sales', editingSale.id), saleData);
        toast.success('Sale updated successfully!');
      } else {
        const docRef = await addDoc(collection(db, 'sales'), {
          ...saleData,
          createdAt: new Date(),
        });
        console.log('Sale added with ID:', docRef.id);
        toast.success('Sale added successfully!');
      }

      resetSaleForm();
      onSalesChange();
    } catch (error) {
      console.error('Detailed error saving sale:', error);
      
      // More specific error messages
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          toast.error('Permission denied. Please check Firebase security rules.');
        } else if (error.message.includes('network')) {
          toast.error('Network error. Please check your internet connection.');
        } else {
          toast.error(`Failed to save sale: ${error.message}`);
        }
      } else {
        toast.error('Failed to save sale. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const customerData = {
        name: customerFormData.name,
        phone: customerFormData.phone,
        email: customerFormData.email,
        address: customerFormData.address,
        city: customerFormData.city,
        updatedAt: new Date(),
      };

      if (editingCustomer) {
        await updateDoc(doc(db, 'customers', editingCustomer.id), customerData);
        toast.success('Customer updated successfully!');
      } else {
        await addDoc(collection(db, 'customers'), {
          ...customerData,
          createdAt: new Date(),
        });
        toast.success('Customer added successfully!');
      }

      resetCustomerForm();
      onCustomersChange();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Failed to save customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteSale = async (saleId: string) => {
    if (confirm('Are you sure you want to delete this sale?')) {
      try {
        await deleteDoc(doc(db, 'sales', saleId));
        toast.success('Sale deleted successfully!');
        onSalesChange();
      } catch (error) {
        console.error('Error deleting sale:', error);
        toast.error('Failed to delete sale.');
      }
    }
  };

  const deleteCustomer = async (customerId: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteDoc(doc(db, 'customers', customerId));
        toast.success('Customer deleted successfully!');
        onCustomersChange();
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast.error('Failed to delete customer.');
      }
    }
  };

  const editSale = (sale: Sale) => {
    setSaleFormData({
      customerId: sale.customerId,
      customerName: sale.customerName,
      customerPhone: sale.customerPhone,
      customerCity: sale.customerCity || '',
      saleDate: sale.saleDate.toISOString().split('T')[0],
      paymentMethod: sale.paymentMethod || 'cash',
      notes: sale.notes || '',
      items: sale.items.map(item => ({
        itemName: item.itemName,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit
      }))
    });
    setEditingSale(sale);
    setShowSaleForm(true);
  };

  const editCustomer = (customer: Customer) => {
    setCustomerFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      city: customer.city || ''
    });
    setEditingCustomer(customer);
    setShowCustomerForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'sales'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sales
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'customers'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Customers
          </button>
        </div>
        
        <div className="flex space-x-2">
          {activeTab === 'sales' && (
            <button
              onClick={() => setShowSaleForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Sale</span>
            </button>
          )}
          {activeTab === 'customers' && (
            <button
              onClick={() => setShowCustomerForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search sales by customer, items, city..."
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShoppingBag className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <button
                onClick={() => handleSearch(searchTerm)}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Sales List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sale ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{sale.id.slice(-6)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {sale.customerName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {sale.customerPhone}
                          </div>
                          {sale.customerCity && (
                            <div className="text-sm text-gray-500">
                              {sale.customerCity}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {sale.items.length} item(s)
                        </div>
                        <div className="text-sm text-gray-500">
                          {sale.items.slice(0, 2).map(item => item.itemName).join(', ')}
                          {sale.items.length > 2 && '...'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(sale.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' :
                          sale.paymentMethod === 'bank' ? 'bg-blue-100 text-blue-800' :
                          sale.paymentMethod === 'jazzcash' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {sale.paymentMethod?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sale.saleDate.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => editSale(sale)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteSale(sale.id)}
                            className="text-red-600 hover:text-red-900"
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
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          {/* Customers List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {customer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.city || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => editCustomer(customer)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteCustomer(customer.id)}
                            className="text-red-600 hover:text-red-900"
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
          </div>
        </div>
      )}

      {/* Sale Form Modal */}
      {showSaleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {editingSale ? 'Edit Sale' : 'Add New Sale'}
                </h2>
                <button
                  onClick={resetSaleForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSaleSubmit} className="space-y-6">
                {/* Customer Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Customer *
                    </label>
                    <select
                      value={saleFormData.customerId}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      required
                      className="input-field"
                    >
                      <option value="">Choose a customer</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sale Date *
                    </label>
                    <input
                      type="date"
                      value={saleFormData.saleDate}
                      onChange={(e) => setSaleFormData(prev => ({ ...prev, saleDate: e.target.value }))}
                      required
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      value={saleFormData.paymentMethod}
                      onChange={(e) => setSaleFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                      className="input-field"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="jazzcash">JazzCash</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Sale Items *
                    </label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={addSaleItem}
                        className="btn-secondary text-sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </button>
                    </div>
                  </div>

                  {/* Available Inventory Section */}
                  {availableItems.length > 0 && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
                        <Package className="h-4 w-4 mr-2" />
                        Available Inventory ({availableItems.length} items)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                        {availableItems.map((invItem, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => selectInventoryItem(invItem.itemName, invItem.suggestedSalePrice, invItem.availableStock)}
                            className="text-left p-2 bg-white rounded border hover:bg-blue-50 hover:border-blue-300 transition-colors"
                          >
                            <div className="text-sm font-medium text-gray-900">{invItem.itemName}</div>
                            <div className="text-xs text-gray-500">
                              Stock: {invItem.availableStock} | Suggested: {formatPrice(invItem.suggestedSalePrice)}
                            </div>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-blue-700 mt-2">
                        💡 Click any item above to add it to your sale with suggested pricing
                      </p>
                    </div>
                  )}

                  {availableItems.length === 0 && (
                    <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800 flex items-center">
                        <Package className="h-4 w-4 mr-2" />
                        No items available in inventory. Add purchases first to see available items here.
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {saleFormData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Item Name
                          </label>
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={(e) => updateSaleItem(index, 'itemName', e.target.value)}
                            required
                            className="input-field"
                            placeholder="Enter item name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateSaleItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            required
                            min="1"
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price per Unit (PKR)
                          </label>
                          <input
                            type="number"
                            value={item.pricePerUnit}
                            onChange={(e) => updateSaleItem(index, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                            required
                            min="0"
                            step="0.01"
                            className="input-field"
                          />
                        </div>
                        <div className="flex items-end">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Total
                            </label>
                            <div className="input-field bg-gray-50">
                              {formatPrice(item.quantity * item.pricePerUnit)}
                            </div>
                          </div>
                          {saleFormData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSaleItem(index)}
                              className="ml-2 p-2 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total Amount */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total Amount:</span>
                      <span className="text-xl font-bold text-primary-600">
                        {formatPrice(calculateTotalAmount())}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={saleFormData.notes}
                    onChange={(e) => setSaleFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="input-field"
                    placeholder="Additional notes about this sale..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={resetSaleForm}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        {editingSale ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      editingSale ? 'Update Sale' : 'Add Sale'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customer Form Modal */}
      {showCustomerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h2>
                <button
                  onClick={resetCustomerForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCustomerSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={customerFormData.name}
                      onChange={(e) => setCustomerFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="input-field"
                      placeholder="Enter customer name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={customerFormData.phone}
                      onChange={(e) => setCustomerFormData(prev => ({ ...prev, phone: e.target.value }))}
                      required
                      className="input-field"
                      placeholder="03XX XXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={customerFormData.email}
                      onChange={(e) => setCustomerFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="input-field"
                      placeholder="customer@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={customerFormData.city}
                      onChange={(e) => setCustomerFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="input-field"
                      placeholder="Enter city"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={customerFormData.address}
                    onChange={(e) => setCustomerFormData(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="input-field"
                    placeholder="Enter complete address"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={resetCustomerForm}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        {editingCustomer ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      editingCustomer ? 'Update Customer' : 'Add Customer'
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