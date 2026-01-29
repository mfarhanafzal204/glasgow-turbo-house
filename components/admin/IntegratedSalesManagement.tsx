'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDocs,
  query,
  orderBy 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Sale, SaleItem, Customer, Item, Purchase } from '@/types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  ShoppingBag, 
  Users,
  Search,
  Link,
  CheckCircle,
  AlertTriangle,
  Package
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/utils';
import { getAvailableItems, checkItemStock } from '@/lib/inventory';
import { updateItemStockFromSale, recalculateItemStock } from '@/lib/stockTracking';

interface IntegratedSalesManagementProps {
  sales: Sale[];
  customers: Customer[];
  purchases: Purchase[];
  onSalesChange: () => void;
  onCustomersChange: () => void;
}

interface LinkedSaleItem extends SaleItem {
  itemId?: string;
  linkedItem?: Item | null;
  availableStock?: number;
}

export default function IntegratedSalesManagement({ 
  sales, 
  customers, 
  purchases,
  onSalesChange, 
  onCustomersChange 
}: IntegratedSalesManagementProps) {
  const [activeTab, setActiveTab] = useState<'sales' | 'customers'>('sales');
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredSales, setFilteredSales] = useState<Sale[]>(sales);
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Sale form data with item linking
  const [saleFormData, setSaleFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerCity: '',
    saleDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash' as 'cash' | 'bank' | 'jazzcash' | 'other',
    notes: '',
    items: [{ 
      itemId: '', 
      itemName: '', 
      quantity: 1, 
      pricePerUnit: 0,
      linkedItem: null as Item | null,
      availableStock: 0
    }]
  });

  // Customer form data
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: ''
  });

  // Load items and calculate available stock
  const loadItemsAndStock = async () => {
    try {
      setIsLoadingItems(true);
      const itemsQuery = query(collection(db, 'items'), orderBy('itemName', 'asc'));
      const snapshot = await getDocs(itemsQuery);
      
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Item[];
      
      const activeItems = itemsData.filter(item => item.isActive);
      setItems(activeItems);

      // Calculate available stock for each item
      const availableItemsWithStock = getAvailableItems(purchases, sales);
      setAvailableItems(availableItemsWithStock);
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Failed to load items catalog');
    } finally {
      setIsLoadingItems(false);
    }
  };

  useEffect(() => {
    loadItemsAndStock();
  }, [purchases, sales]);

  // Update filtered sales when sales or search changes
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = sales.filter(sale => 
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customerPhone.includes(searchTerm) ||
        sale.items.some(item => item.itemName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        sale.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSales(filtered);
    } else {
      setFilteredSales(sales);
    }
  }, [sales, searchTerm]);

  const resetSaleForm = () => {
    setSaleFormData({
      customerId: '',
      customerName: '',
      customerPhone: '',
      customerCity: '',
      saleDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      notes: '',
      items: [{ itemId: '', itemName: '', quantity: 1, pricePerUnit: 0, linkedItem: null, availableStock: 0 }]
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
      items: [...prev.items, { itemId: '', itemName: '', quantity: 1, pricePerUnit: 0, linkedItem: null, availableStock: 0 }]
    }));
  };

  const removeSaleItem = (index: number) => {
    setSaleFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateSaleItem = (index: number, field: string, value: any) => {
    setSaleFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          if (field === 'itemId') {
            // When item is selected from catalog
            const selectedItem = items.find(it => it.id === value);
            const availableItem = availableItems.find(ai => ai.itemName.toLowerCase() === selectedItem?.itemName.toLowerCase());
            
            return {
              ...item,
              itemId: value,
              itemName: selectedItem?.itemName || '',
              linkedItem: selectedItem || null,
              availableStock: availableItem?.availableStock || 0,
              pricePerUnit: availableItem?.suggestedSalePrice || 0
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  };

  const calculateTotalAmount = () => {
    return saleFormData.items.reduce((total, item) => 
      total + (item.quantity * item.pricePerUnit), 0
    );
  };

  const validateStock = () => {
    for (let i = 0; i < saleFormData.items.length; i++) {
      const item = saleFormData.items[i];
      if (item.linkedItem && (item.availableStock || 0) < item.quantity) {
        return {
          valid: false,
          message: `${item.itemName}: Only ${item.availableStock || 0} units available, but ${item.quantity} requested`
        };
      }
    }
    return { valid: true, message: '' };
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (!saleFormData.customerName.trim()) {
        toast.error('Customer name is required');
        return;
      }

      if (!saleFormData.customerPhone.trim()) {
        toast.error('Customer phone is required');
        return;
      }

      if (saleFormData.items.length === 0) {
        toast.error('Please add at least one item');
        return;
      }

      // Validate items
      for (let i = 0; i < saleFormData.items.length; i++) {
        const item = saleFormData.items[i];
        if (!item.itemName.trim()) {
          toast.error(`Item ${i + 1}: Item name is required`);
          return;
        }
        if (item.quantity <= 0) {
          toast.error(`Item ${i + 1}: Quantity must be greater than 0`);
          return;
        }
        if (item.pricePerUnit <= 0) {
          toast.error(`Item ${i + 1}: Price per unit must be greater than 0`);
          return;
        }
      }

      // Validate stock availability
      const stockValidation = validateStock();
      if (!stockValidation.valid) {
        toast.error(stockValidation.message);
        return;
      }

      const saleItems: LinkedSaleItem[] = saleFormData.items.map((item, index) => ({
        id: `item_${index}`,
        itemId: item.itemId || undefined,
        itemName: item.itemName.trim(),
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        totalPrice: item.quantity * item.pricePerUnit
      }));

      const saleData = {
        customerId: saleFormData.customerId || '',
        customerName: saleFormData.customerName.trim(),
        customerPhone: saleFormData.customerPhone.trim(),
        customerCity: saleFormData.customerCity.trim() || '',
        items: saleItems,
        totalAmount: calculateTotalAmount(),
        saleDate: new Date(saleFormData.saleDate),
        paymentMethod: saleFormData.paymentMethod,
        notes: saleFormData.notes.trim() || '',
        updatedAt: new Date(),
      };

      if (editingSale) {
        await updateDoc(doc(db, 'sales', editingSale.id), saleData);
        toast.success('Sale updated successfully!');
      } else {
        await addDoc(collection(db, 'sales'), {
          ...saleData,
          createdAt: new Date(),
        });
        
        // Update item stock for linked items
        for (const item of saleItems) {
          if (item.itemId) {
            try {
              await updateItemStockFromSale({
                ...saleData,
                id: 'temp', // Will be replaced by actual ID
                items: saleItems,
                createdAt: new Date()
              } as Sale);
            } catch (stockError) {
              console.error('Error updating stock for item:', item.itemId, stockError);
              // Don't fail the sale if stock update fails
            }
          }
        }
        
        toast.success('Sale added successfully!');
      }

      resetSaleForm();
      onSalesChange();
    } catch (error) {
      console.error('Error saving sale:', error);
      toast.error('Failed to save sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (!customerFormData.name.trim()) {
        toast.error('Customer name is required');
        return;
      }
      
      if (!customerFormData.phone.trim()) {
        toast.error('Phone number is required');
        return;
      }

      const customerData = {
        name: customerFormData.name.trim(),
        phone: customerFormData.phone.trim(),
        email: customerFormData.email.trim() || '',
        address: customerFormData.address.trim() || '',
        city: customerFormData.city.trim() || '',
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
      toast.error('Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteSale = async (saleId: string) => {
    if (confirm('Are you sure you want to delete this sale?')) {
      try {
        // Get the sale data before deleting to recalculate stock
        const saleToDelete = sales.find(s => s.id === saleId);
        
        await deleteDoc(doc(db, 'sales', saleId));
        
        // Recalculate stock for all items in the deleted sale
        if (saleToDelete) {
          for (const item of saleToDelete.items) {
            const linkedItemId = (item as any).itemId;
            if (linkedItemId) {
              try {
                await recalculateItemStock(linkedItemId);
              } catch (stockError) {
                console.error('Error recalculating stock for item:', linkedItemId, stockError);
              }
            }
          }
        }
        
        toast.success('Sale deleted and stock updated successfully!');
        onSalesChange();
      } catch (error) {
        console.error('Error deleting sale:', error);
        toast.error('Failed to delete sale');
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
        toast.error('Failed to delete customer');
      }
    }
  };

  const editSale = (sale: Sale) => {
    setSaleFormData({
      customerId: sale.customerId || '',
      customerName: sale.customerName,
      customerPhone: sale.customerPhone,
      customerCity: sale.customerCity || '',
      saleDate: sale.saleDate.toISOString().split('T')[0],
      paymentMethod: sale.paymentMethod || 'cash',
      notes: sale.notes || '',
      items: sale.items.map(item => {
        const linkedItem = items.find(it => it.id === (item as any).itemId);
        const availableItem = availableItems.find(ai => ai.itemName.toLowerCase() === item.itemName.toLowerCase());
        return {
          itemId: (item as any).itemId || '',
          itemName: item.itemName,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          linkedItem: linkedItem || null,
          availableStock: availableItem?.availableStock || 0
        };
      })
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
      {/* Header with Tabs - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap ${
              activeTab === 'sales'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sales
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap ml-2 ${
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
              className="btn-primary flex items-center space-x-2 text-sm px-3 py-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Sale</span>
            </button>
          )}
          {activeTab === 'customers' && (
            <button 
              onClick={() => setShowCustomerForm(true)}
              className="btn-primary flex items-center space-x-2 text-sm px-3 py-2"
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
                  placeholder="Search sales by customer, items, notes..."
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShoppingBag className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Available Stock Alert */}
          {availableItems.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Package className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-medium text-blue-900">Available Items for Sale</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                {availableItems.slice(0, 6).map((item, index) => (
                  <div key={index} className="flex justify-between items-center bg-white rounded px-3 py-2">
                    <span className="text-gray-900">{item.itemName}</span>
                    <span className="font-medium text-blue-600">{item.availableStock} units</span>
                  </div>
                ))}
              </div>
              {availableItems.length > 6 && (
                <p className="text-xs text-blue-600 mt-2">+{availableItems.length - 6} more items available</p>
              )}
            </div>
          )}

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
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No sales yet</p>
                        <p className="text-sm">Start by adding your first sale to a customer</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => (
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
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {sale.items.length} item(s)
                          </div>
                          <div className="text-sm text-gray-500 space-y-1">
                            {sale.items.slice(0, 2).map((item, index) => (
                              <div key={index} className="flex items-center">
                                {(item as any).itemId && (
                                  <Link className="h-3 w-3 text-green-600 mr-1" />
                                )}
                                <span>{item.itemName}</span>
                              </div>
                            ))}
                            {sale.items.length > 2 && (
                              <span className="text-gray-400">+{sale.items.length - 2} more</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatPrice(sale.totalAmount)}
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
                    ))
                  )}
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
                      City
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No customers yet</p>
                        <p className="text-sm">Add customers to track your sales</p>
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => {
                      const customerSales = sales.filter(sale => sale.customerId === customer.id);
                      const totalSales = customerSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
                      
                      return (
                        <tr key={customer.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.name}
                            </div>
                            {customer.email && (
                              <div className="text-sm text-gray-500">
                                {customer.email}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {customer.phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {customer.city || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="font-medium">{formatPrice(totalSales)}</div>
                            <div className="text-xs text-gray-500">{customerSales.length} orders</div>
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sale Form Modal */}
      {showSaleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    {editingSale ? 'Edit Sale' : 'Add New Sale'}
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Select items from your catalog with automatic stock validation
                  </p>
                </div>
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
                      Select Customer
                    </label>
                    <select
                      value={saleFormData.customerId}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Choose existing customer...</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={saleFormData.customerName}
                      onChange={(e) => setSaleFormData(prev => ({ ...prev, customerName: e.target.value }))}
                      required
                      className="input-field"
                      placeholder="Enter customer name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Phone *
                    </label>
                    <input
                      type="tel"
                      value={saleFormData.customerPhone}
                      onChange={(e) => setSaleFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                      required
                      className="input-field"
                      placeholder="03XX XXXXXXX"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer City
                    </label>
                    <input
                      type="text"
                      value={saleFormData.customerCity}
                      onChange={(e) => setSaleFormData(prev => ({ ...prev, customerCity: e.target.value }))}
                      className="input-field"
                      placeholder="Enter city"
                    />
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

                {/* Items Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Sale Items *
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Select items from catalog with automatic stock validation
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addSaleItem}
                      className="btn-secondary text-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </button>
                  </div>

                  {isLoadingItems && (
                    <div className="flex items-center justify-center py-4">
                      <LoadingSpinner size="sm" />
                      <span className="ml-2 text-sm text-gray-600">Loading items catalog...</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {saleFormData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 lg:grid-cols-6 gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        {/* Item Selection */}
                        <div className="lg:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Item from Catalog
                          </label>
                          <select
                            value={item.itemId}
                            onChange={(e) => updateSaleItem(index, 'itemId', e.target.value)}
                            className="input-field text-sm"
                          >
                            <option value="">Choose from catalog...</option>
                            {availableItems.map(availableItem => {
                              const catalogItem = items.find(it => it.itemName.toLowerCase() === availableItem.itemName.toLowerCase());
                              return catalogItem ? (
                                <option key={catalogItem.id} value={catalogItem.id}>
                                  {catalogItem.itemCode} - {catalogItem.itemName} ({availableItem.availableStock} available)
                                </option>
                              ) : null;
                            })}
                          </select>
                          {item.linkedItem && (
                            <div className="mt-1 flex items-center text-xs text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Linked to catalog
                            </div>
                          )}
                        </div>

                        {/* Item Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Item Name *
                          </label>
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={(e) => updateSaleItem(index, 'itemName', e.target.value)}
                            required
                            className="input-field text-sm"
                            placeholder="Enter item name"
                            disabled={!!item.linkedItem}
                          />
                          {item.availableStock && item.availableStock > 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                              Stock: {item.availableStock} units
                            </div>
                          )}
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateSaleItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            required
                            min="1"
                            max={item.availableStock && item.availableStock > 0 ? item.availableStock : undefined}
                            className={`input-field text-sm ${
                              item.availableStock && item.availableStock > 0 && item.quantity > item.availableStock 
                                ? 'border-red-300 bg-red-50' 
                                : ''
                            }`}
                          />
                          {item.availableStock && item.availableStock > 0 && item.quantity > item.availableStock && (
                            <div className="text-xs text-red-600 mt-1 flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Exceeds stock
                            </div>
                          )}
                        </div>

                        {/* Price per Unit */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Price per Unit (PKR) *
                          </label>
                          <input
                            type="number"
                            value={item.pricePerUnit}
                            onChange={(e) => updateSaleItem(index, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                            required
                            min="0"
                            step="0.01"
                            className="input-field text-sm"
                          />
                        </div>

                        {/* Total */}
                        <div className="flex items-end">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Total
                            </label>
                            <div className="input-field bg-gray-100 text-sm font-medium">
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