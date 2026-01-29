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
import { Purchase, PurchaseItem, Supplier } from '@/types';
import { Plus, Edit, Trash2, X, ShoppingCart } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/utils';

interface PurchaseManagementProps {
  purchases: Purchase[];
  suppliers: Supplier[];
  onPurchasesChange: () => void;
  onSuppliersChange: () => void;
}

export default function PurchaseManagement({ 
  purchases, 
  suppliers, 
  onPurchasesChange, 
  onSuppliersChange 
}: PurchaseManagementProps) {
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>(purchases);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases');

  // Purchase form data
  const [purchaseFormData, setPurchaseFormData] = useState({
    supplierId: '',
    supplierName: '',
    supplierPhone: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: [{ itemName: '', quantity: 1, costPerUnit: 0 }] as Omit<PurchaseItem, 'id' | 'totalCost'>[]
  });

  // Supplier form data
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: ''
  });

  // Update filtered purchases when purchases or search changes
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = purchases.filter(purchase => 
        purchase.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.supplierPhone.includes(searchTerm) ||
        purchase.items.some(item => item.itemName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        purchase.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPurchases(filtered);
    } else {
      setFilteredPurchases(purchases);
    }
  }, [purchases, searchTerm]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const resetPurchaseForm = () => {
    setPurchaseFormData({
      supplierId: '',
      supplierName: '',
      supplierPhone: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: '',
      items: [{ itemName: '', quantity: 1, costPerUnit: 0 }]
    });
    setEditingPurchase(null);
    setShowPurchaseForm(false);
  };

  const resetSupplierForm = () => {
    setSupplierFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: ''
    });
    setEditingSupplier(null);
    setShowSupplierForm(false);
  };

  const handleSupplierSelect = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setPurchaseFormData(prev => ({
        ...prev,
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierPhone: supplier.phone
      }));
    }
  };

  const addPurchaseItem = () => {
    setPurchaseFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemName: '', quantity: 1, costPerUnit: 0 }]
    }));
  };

  const removePurchaseItem = (index: number) => {
    setPurchaseFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updatePurchaseItem = (index: number, field: keyof Omit<PurchaseItem, 'id' | 'totalCost'>, value: any) => {
    setPurchaseFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTotalAmount = () => {
    return purchaseFormData.items.reduce((total, item) => 
      total + (item.quantity * item.costPerUnit), 0
    );
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const purchaseItems: PurchaseItem[] = purchaseFormData.items.map((item, index) => ({
        id: `item_${index}`,
        itemName: item.itemName,
        quantity: item.quantity,
        costPerUnit: item.costPerUnit,
        totalCost: item.quantity * item.costPerUnit
      }));

      const purchaseData = {
        supplierId: purchaseFormData.supplierId,
        supplierName: purchaseFormData.supplierName,
        supplierPhone: purchaseFormData.supplierPhone,
        items: purchaseItems,
        totalAmount: calculateTotalAmount(),
        purchaseDate: new Date(purchaseFormData.purchaseDate),
        notes: purchaseFormData.notes,
        updatedAt: new Date(),
      };

      if (editingPurchase) {
        await updateDoc(doc(db, 'purchases', editingPurchase.id), purchaseData);
        toast.success('Purchase updated successfully!');
      } else {
        await addDoc(collection(db, 'purchases'), {
          ...purchaseData,
          createdAt: new Date(),
        });
        toast.success('Purchase added successfully!');
      }

      resetPurchaseForm();
      onPurchasesChange();
    } catch (error) {
      console.error('Error saving purchase:', error);
      toast.error('Failed to save purchase. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const supplierData = {
        name: supplierFormData.name,
        contactPerson: supplierFormData.contactPerson,
        phone: supplierFormData.phone,
        email: supplierFormData.email,
        address: supplierFormData.address,
        city: supplierFormData.city,
        updatedAt: new Date(),
      };

      if (editingSupplier) {
        await updateDoc(doc(db, 'suppliers', editingSupplier.id), supplierData);
        toast.success('Supplier updated successfully!');
      } else {
        await addDoc(collection(db, 'suppliers'), {
          ...supplierData,
          createdAt: new Date(),
        });
        toast.success('Supplier added successfully!');
      }

      resetSupplierForm();
      onSuppliersChange();
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast.error('Failed to save supplier. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePurchase = async (purchaseId: string) => {
    if (confirm('Are you sure you want to delete this purchase?')) {
      try {
        await deleteDoc(doc(db, 'purchases', purchaseId));
        toast.success('Purchase deleted successfully!');
        onPurchasesChange();
      } catch (error) {
        console.error('Error deleting purchase:', error);
        toast.error('Failed to delete purchase.');
      }
    }
  };

  const deleteSupplier = async (supplierId: string) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      try {
        await deleteDoc(doc(db, 'suppliers', supplierId));
        toast.success('Supplier deleted successfully!');
        onSuppliersChange();
      } catch (error) {
        console.error('Error deleting supplier:', error);
        toast.error('Failed to delete supplier.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'purchases'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Purchases
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'suppliers'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Suppliers
          </button>
        </div>
        
        <div className="flex space-x-2">
          {activeTab === 'purchases' && (
            <button
              onClick={() => setShowPurchaseForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Purchase</span>
            </button>
          )}
          {activeTab === 'suppliers' && (
            <button
              onClick={() => setShowSupplierForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* Purchases Tab */}
      {activeTab === 'purchases' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search purchases by supplier, items, notes..."
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShoppingCart className="h-5 w-5 text-gray-400" />
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

          {/* Purchases List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
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
                  {filteredPurchases.map((purchase) => (
                    <tr key={purchase.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{purchase.id.slice(-6)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {purchase.supplierName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {purchase.supplierPhone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {purchase.items.length} item(s)
                        </div>
                        <div className="text-sm text-gray-500">
                          {purchase.items.slice(0, 2).map(item => item.itemName).join(', ')}
                          {purchase.items.length > 2 && '...'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(purchase.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {purchase.purchaseDate.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => deletePurchase(purchase.id)}
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

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          {/* Suppliers List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Person
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
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
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {supplier.name}
                        </div>
                        {supplier.email && (
                          <div className="text-sm text-gray-500">
                            {supplier.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supplier.contactPerson}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supplier.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {supplier.city || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => deleteSupplier(supplier.id)}
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

      {/* Purchase Form Modal */}
      {showPurchaseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {editingPurchase ? 'Edit Purchase' : 'Add New Purchase'}
                </h2>
                <button
                  onClick={resetPurchaseForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handlePurchaseSubmit} className="space-y-6">
                {/* Supplier Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Supplier *
                    </label>
                    <select
                      value={purchaseFormData.supplierId}
                      onChange={(e) => handleSupplierSelect(e.target.value)}
                      required
                      className="input-field"
                    >
                      <option value="">Choose a supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name} - {supplier.phone}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Purchase Date *
                    </label>
                    <input
                      type="date"
                      value={purchaseFormData.purchaseDate}
                      onChange={(e) => setPurchaseFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                      required
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Purchase Items *
                    </label>
                    <button
                      type="button"
                      onClick={addPurchaseItem}
                      className="btn-secondary text-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-4">
                    {purchaseFormData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Item Name
                          </label>
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={(e) => updatePurchaseItem(index, 'itemName', e.target.value)}
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
                            onChange={(e) => updatePurchaseItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            required
                            min="1"
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cost per Unit (PKR)
                          </label>
                          <input
                            type="number"
                            value={item.costPerUnit}
                            onChange={(e) => updatePurchaseItem(index, 'costPerUnit', parseFloat(e.target.value) || 0)}
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
                              {formatPrice(item.quantity * item.costPerUnit)}
                            </div>
                          </div>
                          {purchaseFormData.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePurchaseItem(index)}
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
                    value={purchaseFormData.notes}
                    onChange={(e) => setPurchaseFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="input-field"
                    placeholder="Additional notes about this purchase..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={resetPurchaseForm}
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
                        {editingPurchase ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      editingPurchase ? 'Update Purchase' : 'Add Purchase'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Form Modal */}
      {showSupplierForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h2>
                <button
                  onClick={resetSupplierForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSupplierSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier Name *
                    </label>
                    <input
                      type="text"
                      value={supplierFormData.name}
                      onChange={(e) => setSupplierFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="input-field"
                      placeholder="Enter supplier name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person *
                    </label>
                    <input
                      type="text"
                      value={supplierFormData.contactPerson}
                      onChange={(e) => setSupplierFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                      required
                      className="input-field"
                      placeholder="Enter contact person name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={supplierFormData.phone}
                      onChange={(e) => setSupplierFormData(prev => ({ ...prev, phone: e.target.value }))}
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
                      value={supplierFormData.email}
                      onChange={(e) => setSupplierFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="input-field"
                      placeholder="supplier@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={supplierFormData.city}
                      onChange={(e) => setSupplierFormData(prev => ({ ...prev, city: e.target.value }))}
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
                    value={supplierFormData.address}
                    onChange={(e) => setSupplierFormData(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="input-field"
                    placeholder="Enter complete address"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={resetSupplierForm}
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
                        {editingSupplier ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      editingSupplier ? 'Update Supplier' : 'Add Supplier'
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