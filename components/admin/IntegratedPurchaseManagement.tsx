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
import { Purchase, PurchaseItem, Supplier, Item } from '@/types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  ShoppingCart, 
  Package, 
  Search,
  Link,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/utils';
import { updateItemStockFromPurchase, recalculateItemStock } from '@/lib/stockTracking';

interface IntegratedPurchaseManagementProps {
  purchases: Purchase[];
  suppliers: Supplier[];
  onPurchasesChange: () => void;
  onSuppliersChange: () => void;
}

interface LinkedPurchaseItem extends PurchaseItem {
  itemId?: string;
  linkedItem?: Item | null;
}

export default function IntegratedPurchaseManagement({ 
  purchases, 
  suppliers, 
  onPurchasesChange, 
  onSuppliersChange 
}: IntegratedPurchaseManagementProps) {
  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases');
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>(purchases);
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Purchase form data with item linking
  const [purchaseFormData, setPurchaseFormData] = useState({
    supplierId: '',
    supplierName: '',
    supplierPhone: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: [{ 
      itemId: '', 
      itemName: '', 
      quantity: 1, 
      costPerUnit: 0,
      linkedItem: null as Item | null
    }]
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

  // Load items from Firebase
  const loadItems = async () => {
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
      
      setItems(itemsData.filter(item => item.isActive));
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Failed to load items catalog');
    } finally {
      setIsLoadingItems(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

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

  const resetPurchaseForm = () => {
    setPurchaseFormData({
      supplierId: '',
      supplierName: '',
      supplierPhone: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: '',
      items: [{ itemId: '', itemName: '', quantity: 1, costPerUnit: 0, linkedItem: null }]
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
      items: [...prev.items, { itemId: '', itemName: '', quantity: 1, costPerUnit: 0, linkedItem: null }]
    }));
  };

  const removePurchaseItem = (index: number) => {
    setPurchaseFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updatePurchaseItem = (index: number, field: string, value: any) => {
    setPurchaseFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          if (field === 'itemId') {
            // When item is selected from catalog
            const selectedItem = items.find(it => it.id === value);
            return {
              ...item,
              itemId: value,
              itemName: selectedItem?.itemName || '',
              linkedItem: selectedItem || null
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
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
      // Validation
      if (!purchaseFormData.supplierId) {
        toast.error('Please select a supplier');
        return;
      }

      if (purchaseFormData.items.length === 0) {
        toast.error('Please add at least one item');
        return;
      }

      // Validate items
      for (let i = 0; i < purchaseFormData.items.length; i++) {
        const item = purchaseFormData.items[i];
        if (!item.itemName.trim()) {
          toast.error(`Item ${i + 1}: Item name is required`);
          return;
        }
        if (item.quantity <= 0) {
          toast.error(`Item ${i + 1}: Quantity must be greater than 0`);
          return;
        }
        if (item.costPerUnit <= 0) {
          toast.error(`Item ${i + 1}: Cost per unit must be greater than 0`);
          return;
        }
      }

      const purchaseItems: LinkedPurchaseItem[] = purchaseFormData.items.map((item, index) => ({
        id: `item_${index}`,
        itemId: item.itemId || undefined,
        itemName: item.itemName.trim(),
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
        notes: purchaseFormData.notes.trim() || '',
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
        
        // Update item stock for linked items
        for (const item of purchaseItems) {
          if (item.itemId) {
            try {
              await updateItemStockFromPurchase({
                ...purchaseData,
                id: 'temp', // Will be replaced by actual ID
                items: purchaseItems,
                createdAt: new Date()
              } as Purchase);
            } catch (stockError) {
              console.error('Error updating stock for item:', item.itemId, stockError);
              // Don't fail the purchase if stock update fails
            }
          }
        }
        
        toast.success('Purchase added successfully!');
      }

      resetPurchaseForm();
      onPurchasesChange();
    } catch (error) {
      console.error('Error saving purchase:', error);
      toast.error('Failed to save purchase');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (!supplierFormData.name.trim()) {
        toast.error('Supplier name is required');
        return;
      }
      
      if (!supplierFormData.contactPerson.trim()) {
        toast.error('Contact person is required');
        return;
      }
      
      if (!supplierFormData.phone.trim()) {
        toast.error('Phone number is required');
        return;
      }

      const supplierData = {
        name: supplierFormData.name.trim(),
        contactPerson: supplierFormData.contactPerson.trim(),
        phone: supplierFormData.phone.trim(),
        email: supplierFormData.email.trim() || '',
        address: supplierFormData.address.trim() || '',
        city: supplierFormData.city.trim() || '',
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
      toast.error('Failed to save supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePurchase = async (purchaseId: string) => {
    if (confirm('Are you sure you want to delete this purchase?')) {
      try {
        // Get the purchase data before deleting to recalculate stock
        const purchaseToDelete = purchases.find(p => p.id === purchaseId);
        
        await deleteDoc(doc(db, 'purchases', purchaseId));
        
        // Recalculate stock for all items in the deleted purchase
        if (purchaseToDelete) {
          for (const item of purchaseToDelete.items) {
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
        
        toast.success('Purchase deleted and stock updated successfully!');
        onPurchasesChange();
      } catch (error) {
        console.error('Error deleting purchase:', error);
        toast.error('Failed to delete purchase');
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
        toast.error('Failed to delete supplier');
      }
    }
  };

  const editPurchase = (purchase: Purchase) => {
    setPurchaseFormData({
      supplierId: purchase.supplierId,
      supplierName: purchase.supplierName,
      supplierPhone: purchase.supplierPhone,
      purchaseDate: purchase.purchaseDate.toISOString().split('T')[0],
      notes: purchase.notes || '',
      items: purchase.items.map(item => {
        const linkedItem = items.find(it => it.id === (item as any).itemId);
        return {
          itemId: (item as any).itemId || '',
          itemName: item.itemName,
          quantity: item.quantity,
          costPerUnit: item.costPerUnit,
          linkedItem: linkedItem || null
        };
      })
    });
    setEditingPurchase(purchase);
    setShowPurchaseForm(true);
  };

  const editSupplier = (supplier: Supplier) => {
    setSupplierFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email || '',
      address: supplier.address || '',
      city: supplier.city || ''
    });
    setEditingSupplier(supplier);
    setShowSupplierForm(true);
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
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No purchases yet</p>
                        <p className="text-sm">Start by adding your first purchase from a supplier</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPurchases.map((purchase) => (
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
                          <div className="text-sm text-gray-500 space-y-1">
                            {purchase.items.slice(0, 2).map((item, index) => (
                              <div key={index} className="flex items-center">
                                {(item as any).itemId && (
                                  <Link className="h-3 w-3 text-green-600 mr-1" />
                                )}
                                <span>{item.itemName}</span>
                              </div>
                            ))}
                            {purchase.items.length > 2 && (
                              <span className="text-gray-400">+{purchase.items.length - 2} more</span>
                            )}
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
                              onClick={() => editPurchase(purchase)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deletePurchase(purchase.id)}
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
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <Plus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No suppliers yet</p>
                        <p className="text-sm">Add suppliers to track your purchases</p>
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((supplier) => (
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
                              onClick={() => editSupplier(supplier)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteSupplier(supplier.id)}
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

      {/* Purchase Form Modal */}
      {showPurchaseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    {editingPurchase ? 'Edit Purchase' : 'Add New Purchase'}
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Link items from your catalog for better inventory tracking
                  </p>
                </div>
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

                {/* Items Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Purchase Items *
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Link items from your catalog or add custom items
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addPurchaseItem}
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
                    {purchaseFormData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 lg:grid-cols-6 gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        {/* Item Selection */}
                        <div className="lg:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Item from Catalog
                          </label>
                          <select
                            value={item.itemId}
                            onChange={(e) => updatePurchaseItem(index, 'itemId', e.target.value)}
                            className="input-field text-sm"
                          >
                            <option value="">Choose from catalog...</option>
                            {items.map(catalogItem => (
                              <option key={catalogItem.id} value={catalogItem.id}>
                                {catalogItem.itemCode} - {catalogItem.itemName}
                              </option>
                            ))}
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
                            onChange={(e) => updatePurchaseItem(index, 'itemName', e.target.value)}
                            required
                            className="input-field text-sm"
                            placeholder="Enter item name"
                            disabled={!!item.linkedItem}
                          />
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updatePurchaseItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            required
                            min="1"
                            className="input-field text-sm"
                          />
                        </div>

                        {/* Cost per Unit */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cost per Unit (PKR) *
                          </label>
                          <input
                            type="number"
                            value={item.costPerUnit}
                            onChange={(e) => updatePurchaseItem(index, 'costPerUnit', parseFloat(e.target.value) || 0)}
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