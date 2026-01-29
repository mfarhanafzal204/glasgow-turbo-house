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
import { Plus, Edit, Trash2, X, ShoppingCart, Package } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/utils';
import { testFirebaseConnection, testSupplierCollection } from '@/lib/firebaseTest';

interface WorkingPurchaseManagementProps {
  purchases: Purchase[];
  suppliers: Supplier[];
  onPurchasesChange: () => void;
  onSuppliersChange: () => void;
}

export default function WorkingPurchaseManagement({ 
  purchases, 
  suppliers, 
  onPurchasesChange, 
  onSuppliersChange 
}: WorkingPurchaseManagementProps) {
  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases');
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>(purchases);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productSearchResults, setProductSearchResults] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'supplier' | 'quantity' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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

  // Enhanced keyword-based search with category filtering
  const keywordBasedSearch = (searchTerm: string) => {
    const productMap = new Map<string, any>();
    const searchWords = searchTerm.toLowerCase().trim().split(/\s+/);
    
    purchases.forEach(purchase => {
      purchase.items.forEach(item => {
        const itemNameLower = item.itemName.toLowerCase();
        
        // Check if ALL search words are present in the item name
        const matchesAllKeywords = searchWords.every(word => {
          // Handle common typos for specific keywords
          const correctedWord = correctCommonTypos(word);
          return itemNameLower.includes(correctedWord) || 
                 itemNameLower.includes(word) ||
                 calculateWordSimilarity(word, itemNameLower) > 0.8;
        });
        
        if (matchesAllKeywords) {
          // Determine the primary category/type of the item
          const itemCategory = determineItemCategory(item.itemName);
          const searchCategory = determineSearchCategory(searchTerm);
          
          // Only include if categories match or search is general
          if (searchCategory === 'general' || itemCategory === searchCategory || 
              itemCategory === 'mixed' || searchCategory === 'mixed') {
            
            const productKey = item.itemName.toLowerCase();
            
            if (productMap.has(productKey)) {
              const existing = productMap.get(productKey);
              existing.totalQuantity += item.quantity;
              existing.suppliers.push({
                supplierName: purchase.supplierName,
                supplierPhone: purchase.supplierPhone,
                quantity: item.quantity,
                costPerUnit: item.costPerUnit,
                totalCost: item.totalCost,
                purchaseDate: purchase.purchaseDate,
                purchaseId: purchase.id
              });
            } else {
              productMap.set(productKey, {
                productName: item.itemName,
                totalQuantity: item.quantity,
                category: itemCategory,
                matchType: getMatchType(searchTerm, item.itemName),
                suppliers: [{
                  supplierName: purchase.supplierName,
                  supplierPhone: purchase.supplierPhone,
                  quantity: item.quantity,
                  costPerUnit: item.costPerUnit,
                  totalCost: item.totalCost,
                  purchaseDate: purchase.purchaseDate,
                  purchaseId: purchase.id
                }]
              });
            }
          }
        }
      });
    });

    return Array.from(productMap.values())
      .sort((a, b) => {
        // Sort by match type priority, then by name
        const matchPriority = { 'exact': 3, 'contains': 2, 'fuzzy': 1 };
        const aPriority = matchPriority[a.matchType as keyof typeof matchPriority] || 0;
        const bPriority = matchPriority[b.matchType as keyof typeof matchPriority] || 0;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        return a.productName.localeCompare(b.productName);
      });
  };

  // Correct common typos for specific automotive terms
  const correctCommonTypos = (word: string): string => {
    const typoCorrections: { [key: string]: string } = {
      'terbo': 'turbo',
      'turb': 'turbo',
      'tubro': 'turbo',
      'core': 'core',
      'cor': 'core',
      'croe': 'core',
      'cartridge': 'cartridge',
      'cartrige': 'cartridge',
      'catridge': 'cartridge',
      'hilax': 'hilux',
      'hilx': 'hilux',
      'corola': 'corolla',
      'carola': 'corolla',
      'diesl': 'diesel',
      'disel': 'diesel',
      'petrl': 'petrol',
      'petol': 'petrol',
      'toyata': 'toyota',
      'toyoto': 'toyota'
    };
    
    return typoCorrections[word] || word;
  };

  // Determine item category based on keywords
  const determineItemCategory = (itemName: string): string => {
    const nameLower = itemName.toLowerCase();
    
    if (nameLower.includes('turbo') && !nameLower.includes('core') && !nameLower.includes('cartridge')) {
      return 'turbo';
    }
    if (nameLower.includes('core') || nameLower.includes('cartridge')) {
      return 'core';
    }
    if (nameLower.includes('engine')) {
      return 'engine';
    }
    if (nameLower.includes('filter')) {
      return 'filter';
    }
    if (nameLower.includes('oil')) {
      return 'oil';
    }
    if (nameLower.includes('brake')) {
      return 'brake';
    }
    
    // If contains multiple categories or unclear
    const categories = ['turbo', 'core', 'engine', 'filter', 'oil', 'brake'];
    const matchedCategories = categories.filter(cat => nameLower.includes(cat));
    
    if (matchedCategories.length > 1) {
      return 'mixed';
    }
    
    return 'general';
  };

  // Determine search category based on search term
  const determineSearchCategory = (searchTerm: string): string => {
    const searchLower = searchTerm.toLowerCase();
    const correctedSearch = searchTerm.split(/\s+/).map(word => correctCommonTypos(word.toLowerCase())).join(' ');
    
    if (correctedSearch.includes('turbo') && !correctedSearch.includes('core') && !correctedSearch.includes('cartridge')) {
      return 'turbo';
    }
    if (correctedSearch.includes('core') || correctedSearch.includes('cartridge')) {
      return 'core';
    }
    if (correctedSearch.includes('engine')) {
      return 'engine';
    }
    if (correctedSearch.includes('filter')) {
      return 'filter';
    }
    if (correctedSearch.includes('oil')) {
      return 'oil';
    }
    if (correctedSearch.includes('brake')) {
      return 'brake';
    }
    
    return 'general';
  };

  // Calculate word similarity for fuzzy matching
  const calculateWordSimilarity = (word: string, text: string): number => {
    // Simple similarity check for individual words within text
    const words = text.split(/\s+/);
    let maxSimilarity = 0;
    
    words.forEach(textWord => {
      const similarity = calculateSimilarity(word, textWord);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    });
    
    return maxSimilarity;
  };

  // Get match type for display
  const getMatchType = (searchTerm: string, itemName: string): string => {
    const searchLower = searchTerm.toLowerCase();
    const itemLower = itemName.toLowerCase();
    
    if (itemLower === searchLower) return 'exact';
    if (itemLower.includes(searchLower)) return 'contains';
    return 'fuzzy';
  };

  // Fuzzy search function to handle typos and misspellings (kept for word similarity)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Exact match gets highest score
    if (s1 === s2) return 1;
    
    // Contains match gets high score
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    
    // Levenshtein distance for fuzzy matching
    const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
    
    for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= s2.length; j++) {
      for (let i = 1; i <= s1.length; i++) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    const distance = matrix[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    return 1 - distance / maxLength;
  };
  // Product search functionality with keyword-based category filtering
  useEffect(() => {
    if (productSearchTerm.trim()) {
      let results = keywordBasedSearch(productSearchTerm.trim());
      
      // Sort results
      results.forEach(product => {
        product.suppliers.sort((a: any, b: any) => {
          switch (sortBy) {
            case 'supplier':
              return sortOrder === 'asc' 
                ? a.supplierName.localeCompare(b.supplierName)
                : b.supplierName.localeCompare(a.supplierName);
            case 'quantity':
              return sortOrder === 'asc' 
                ? a.quantity - b.quantity
                : b.quantity - a.quantity;
            case 'date':
              return sortOrder === 'asc'
                ? new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
                : new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
            default:
              return 0;
          }
        });
      });

      // Sort products
      results.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return sortOrder === 'asc'
              ? a.productName.localeCompare(b.productName)
              : b.productName.localeCompare(a.productName);
          case 'quantity':
            return sortOrder === 'asc'
              ? a.totalQuantity - b.totalQuantity
              : b.totalQuantity - a.totalQuantity;
          default:
            // Default sort by match type priority, then by name
            const matchPriority = { 'exact': 3, 'contains': 2, 'fuzzy': 1 };
            const aPriority = matchPriority[a.matchType as keyof typeof matchPriority] || 0;
            const bPriority = matchPriority[b.matchType as keyof typeof matchPriority] || 0;
            
            if (aPriority !== bPriority) {
              return bPriority - aPriority;
            }
            return a.productName.localeCompare(b.productName);
        }
      });

      setProductSearchResults(results);
    } else {
      setProductSearchResults([]);
    }
  }, [purchases, productSearchTerm, sortBy, sortOrder]);

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
      // Validate required fields
      if (!purchaseFormData.supplierId) {
        toast.error('Please select a supplier');
        setIsSubmitting(false);
        return;
      }

      if (purchaseFormData.items.length === 0) {
        toast.error('Please add at least one item');
        setIsSubmitting(false);
        return;
      }

      // Validate items
      for (let i = 0; i < purchaseFormData.items.length; i++) {
        const item = purchaseFormData.items[i];
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
        if (item.costPerUnit <= 0) {
          toast.error(`Item ${i + 1}: Cost per unit must be greater than 0`);
          setIsSubmitting(false);
          return;
        }
      }

      const purchaseItems: PurchaseItem[] = purchaseFormData.items.map((item, index) => ({
        id: `item_${index}`,
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

      console.log('Attempting to save purchase:', purchaseData);

      if (editingPurchase) {
        await updateDoc(doc(db, 'purchases', editingPurchase.id), purchaseData);
        toast.success('Purchase updated successfully!');
      } else {
        const docRef = await addDoc(collection(db, 'purchases'), {
          ...purchaseData,
          createdAt: new Date(),
        });
        console.log('Purchase added with ID:', docRef.id);
        toast.success('Purchase added successfully!');
      }

      resetPurchaseForm();
      onPurchasesChange();
    } catch (error) {
      console.error('Detailed error saving purchase:', error);
      
      // More specific error messages
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          toast.error('Permission denied. Please check Firebase security rules.');
        } else if (error.message.includes('network')) {
          toast.error('Network error. Please check your internet connection.');
        } else {
          toast.error(`Failed to save purchase: ${error.message}`);
        }
      } else {
        toast.error('Failed to save purchase. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!supplierFormData.name.trim()) {
        toast.error('Supplier name is required');
        setIsSubmitting(false);
        return;
      }
      
      if (!supplierFormData.contactPerson.trim()) {
        toast.error('Contact person is required');
        setIsSubmitting(false);
        return;
      }
      
      if (!supplierFormData.phone.trim()) {
        toast.error('Phone number is required');
        setIsSubmitting(false);
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

      console.log('Attempting to save supplier:', supplierData);

      if (editingSupplier) {
        await updateDoc(doc(db, 'suppliers', editingSupplier.id), supplierData);
        toast.success('Supplier updated successfully!');
      } else {
        const docRef = await addDoc(collection(db, 'suppliers'), {
          ...supplierData,
          createdAt: new Date(),
        });
        console.log('Supplier added with ID:', docRef.id);
        toast.success('Supplier added successfully!');
      }

      resetSupplierForm();
      onSuppliersChange();
    } catch (error) {
      console.error('Detailed error saving supplier:', error);
      
      // More specific error messages
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          toast.error('Permission denied. Please check Firebase security rules.');
        } else if (error.message.includes('network')) {
          toast.error('Network error. Please check your internet connection.');
        } else {
          toast.error(`Failed to save supplier: ${error.message}`);
        }
      } else {
        toast.error('Failed to save supplier. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePurchase = async (purchaseId: string) => {
    if (confirm('Are you sure you want to delete this purchase?')) {
      try {
        console.log('Attempting to delete purchase:', purchaseId);
        await deleteDoc(doc(db, 'purchases', purchaseId));
        toast.success('Purchase deleted successfully!');
        onPurchasesChange();
      } catch (error) {
        console.error('Detailed error deleting purchase:', error);
        if (error instanceof Error) {
          if (error.message.includes('permission-denied')) {
            toast.error('Permission denied. Please check Firebase security rules.');
          } else {
            toast.error(`Failed to delete purchase: ${error.message}`);
          }
        } else {
          toast.error('Failed to delete purchase.');
        }
      }
    }
  };

  const deleteSupplier = async (supplierId: string) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      try {
        console.log('Attempting to delete supplier:', supplierId);
        await deleteDoc(doc(db, 'suppliers', supplierId));
        toast.success('Supplier deleted successfully!');
        onSuppliersChange();
      } catch (error) {
        console.error('Detailed error deleting supplier:', error);
        if (error instanceof Error) {
          if (error.message.includes('permission-denied')) {
            toast.error('Permission denied. Please check Firebase security rules.');
          } else {
            toast.error(`Failed to delete supplier: ${error.message}`);
          }
        } else {
          toast.error('Failed to delete supplier.');
        }
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
      items: purchase.items.map(item => ({
        itemName: item.itemName,
        quantity: item.quantity,
        costPerUnit: item.costPerUnit
      }))
    });
    setEditingPurchase(purchase);
    setShowPurchaseForm(true);
  };

  const testConnection = async () => {
    console.log('Testing Firebase connection...');
    const result = await testFirebaseConnection();
    if (result.success) {
      toast.success('Firebase connection working!');
    } else {
      toast.error('Firebase connection failed!');
    }
    
    const supplierTest = await testSupplierCollection();
    if (supplierTest.success) {
      toast.success(`Suppliers collection accessible. Found ${supplierTest.count} documents.`);
    } else {
      toast.error('Suppliers collection not accessible!');
    }
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
          <button
            onClick={testConnection}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Test Firebase
          </button>
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
              <button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                Search
              </button>
            </div>
          </div>

          {/* Product-Based Search Section */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              🔍 Product Stock Search
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              Search for specific product categories to see combined stock from all suppliers. 
              <strong>Category-specific search</strong> - "turbo" shows only turbo items, "core" shows only core/cartridge items!
            </p>
            
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  placeholder="Type category/product name (e.g., 'turbo' for turbos only, 'core' for cores only)..."
                  className="block w-full pl-10 pr-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Package className="h-5 w-5 text-blue-400" />
                </div>
              </div>
              
              {/* Sort Controls */}
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                >
                  <option value="name">Sort by Product</option>
                  <option value="supplier">Sort by Supplier</option>
                  <option value="quantity">Sort by Quantity</option>
                  <option value="date">Sort by Date</option>
                </select>
                
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            {/* Product Search Results */}
            {productSearchResults.length > 0 && (
              <div className="space-y-4">
                {/* Search Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <strong>✅ Found {productSearchResults.length} product(s)</strong> matching "{productSearchTerm}"
                    {productSearchResults.length > 0 && (
                      <span className="ml-2 text-green-600">
                        (Category: {determineSearchCategory(productSearchTerm)})
                      </span>
                    )}
                  </p>
                </div>

                {productSearchResults.map((product, index) => (
                  <div key={index} className="bg-white border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {product.productName}
                        </h4>
                        {/* Match type indicator */}
                        {product.matchType === 'exact' && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            ✅ Exact Match
                          </span>
                        )}
                        {product.matchType === 'contains' && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            🎯 Contains Match
                          </span>
                        )}
                        {product.matchType === 'fuzzy' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            🔍 Fuzzy Match
                          </span>
                        )}
                        {/* Category indicator */}
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          📂 {product.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-blue-600">
                          Total Stock: {product.totalQuantity}
                        </span>
                        <p className="text-sm text-gray-500">
                          From {product.suppliers.length} supplier(s)
                        </p>
                      </div>
                    </div>
                    
                    {/* Supplier Breakdown */}
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-700 mb-2">Supplier Breakdown:</h5>
                      <div className="grid gap-2">
                        {product.suppliers.map((supplier: any, supplierIndex: number) => (
                          <div key={supplierIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-4">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {supplier.supplierName}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {supplier.supplierPhone}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-lg font-semibold text-blue-600">
                                    {supplier.quantity} units
                                  </p>
                                  <p className="text-xs text-gray-500">Quantity</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatPrice(supplier.costPerUnit)}
                                  </p>
                                  <p className="text-xs text-gray-500">Cost/Unit</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatPrice(supplier.totalCost)}
                                  </p>
                                  <p className="text-xs text-gray-500">Total Cost</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm text-gray-600">
                                    {supplier.purchaseDate.toLocaleDateString()}
                                  </p>
                                  <p className="text-xs text-gray-500">Purchase Date</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {productSearchTerm.trim() && productSearchResults.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No products found matching "{productSearchTerm}"</p>
                <div className="text-sm text-gray-400 mt-2 space-y-1">
                  <p>💡 Search Tips:</p>
                  <p>• <strong>Category Search:</strong> "turbo" shows only turbo items, "core" shows only core/cartridge items</p>
                  <p>• <strong>Specific Models:</strong> "gt3576 turbo" shows GT3576 turbo variants</p>
                  <p>• <strong>Typo Handling:</strong> "terbo" will find "turbo" items</p>
                  <p>• <strong>Multiple Words:</strong> "hilux turbo" finds Hilux turbo products</p>
                </div>
              </div>
            )}
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