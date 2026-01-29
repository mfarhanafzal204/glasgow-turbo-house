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
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Item, ItemSupplier, Supplier, Purchase, Sale } from '@/types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Package, 
  Search,
  Filter,
  Eye,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Settings,
  Tag,
  Truck,
  Archive,
  History,
  Calendar,
  DollarSign,
  User,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/utils';
import { getItemStockSummary, ItemStockSummary, recalculateAllItemStocks, resetAllStockData, debugItemStock, getItemProfitAnalysis } from '@/lib/stockTracking';

interface ItemManagementProps {
  suppliers: Supplier[];
  onSuppliersChange: () => void;
}

interface ItemPurchaseHistory {
  purchaseId: string;
  supplierName: string;
  supplierPhone: string;
  quantity: number;
  costPerUnit: number;
  totalCost: number;
  purchaseDate: Date;
  notes?: string;
}

interface ItemSaleHistory {
  saleId: string;
  customerName: string;
  customerPhone: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  saleDate: Date;
  notes?: string;
}

export default function ItemManagement({ suppliers, onSuppliersChange }: ItemManagementProps) {
  const [activeTab, setActiveTab] = useState<'items' | 'categories' | 'stock'>('items');
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [stockSummary, setStockSummary] = useState<ItemStockSummary[]>([]);
  const [itemPurchaseHistory, setItemPurchaseHistory] = useState<ItemPurchaseHistory[]>([]);
  const [itemSaleHistory, setItemSaleHistory] = useState<ItemSaleHistory[]>([]);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [showProfitAnalysis, setShowProfitAnalysis] = useState(false);
  const [profitAnalysisData, setProfitAnalysisData] = useState<any>(null);
  const [isLoadingProfit, setIsLoadingProfit] = useState(false);

  // Item form data
  const [itemFormData, setItemFormData] = useState({
    itemCode: '',
    itemName: '',
    description: '',
    category: 'turbo' as Item['category'],
    subcategory: '',
    brand: '',
    model: '',
    compatibleVehicles: [''],
    unitOfMeasure: 'piece' as Item['unitOfMeasure'],
    minimumStock: 5,
    maximumStock: 100,
    reorderLevel: 10,
    storageLocation: '',
    barcode: '',
    notes: '',
    isActive: true
  });

  // Categories for filtering and form
  const categories = [
    { value: 'turbo', label: 'Turbo', icon: '🚗', color: 'bg-blue-100 text-blue-800' },
    { value: 'core', label: 'Core/Cartridge', icon: '⚙️', color: 'bg-green-100 text-green-800' },
    { value: 'engine', label: 'Engine Parts', icon: '🔧', color: 'bg-red-100 text-red-800' },
    { value: 'filter', label: 'Filters', icon: '🔍', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'oil', label: 'Oil & Fluids', icon: '🛢️', color: 'bg-purple-100 text-purple-800' },
    { value: 'brake', label: 'Brake Parts', icon: '🛑', color: 'bg-orange-100 text-orange-800' },
    { value: 'other', label: 'Other', icon: '📦', color: 'bg-gray-100 text-gray-800' }
  ];

  // Load items from Firebase
  const loadItems = async () => {
    try {
      setIsLoading(true);
      const itemsQuery = query(collection(db, 'items'), orderBy('itemName', 'asc'));
      const snapshot = await getDocs(itemsQuery);
      
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Item[];
      
      setItems(itemsData);
      setFilteredItems(itemsData);
      
      // Load stock summary
      await loadStockSummary();
    } catch (error) {
      console.error('Error loading items:', error);
      toast.error('Failed to load items');
    } finally {
      setIsLoading(false);
    }
  };

  // Load stock summary separately for better control
  const loadStockSummary = async () => {
    try {
      const stockData = await getItemStockSummary();
      setStockSummary(stockData);
    } catch (stockError) {
      console.error('Error loading stock summary:', stockError);
      // Don't fail if stock loading fails
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Refresh stock data when component becomes visible or data changes
  useEffect(() => {
    const refreshStockData = () => {
      loadStockSummary();
    };

    // Listen for focus events to refresh data
    window.addEventListener('focus', refreshStockData);
    
    // Set up interval to refresh stock data every 30 seconds
    const stockRefreshInterval = setInterval(refreshStockData, 30000);
    
    return () => {
      window.removeEventListener('focus', refreshStockData);
      clearInterval(stockRefreshInterval);
    };
  }, []);

  // Filter items based on search and category
  useEffect(() => {
    let filtered = items;

    // Apply search filter with priority for item codes
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      
      // First, find exact code matches
      const exactCodeMatches = filtered.filter(item =>
        item.itemCode.toLowerCase() === searchLower
      );
      
      // Then, find partial code matches
      const partialCodeMatches = filtered.filter(item =>
        item.itemCode.toLowerCase() !== searchLower &&
        item.itemCode.toLowerCase().includes(searchLower)
      );
      
      // Finally, find other matches
      const otherMatches = filtered.filter(item =>
        !item.itemCode.toLowerCase().includes(searchLower) &&
        (item.itemName.toLowerCase().includes(searchLower) ||
         item.description.toLowerCase().includes(searchLower) ||
         item.brand?.toLowerCase().includes(searchLower) ||
         item.model?.toLowerCase().includes(searchLower) ||
         item.compatibleVehicles.some(vehicle => 
           vehicle.toLowerCase().includes(searchLower)
         ))
      );
      
      // Combine results with priority: exact code → partial code → other matches
      filtered = [...exactCodeMatches, ...partialCodeMatches, ...otherMatches];
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    setFilteredItems(filtered);
  }, [items, searchTerm, categoryFilter]);

  // Generate item code automatically (optional helper)
  const generateItemCode = (category: string, brand: string, model: string) => {
    const categoryCode = category.toUpperCase().substring(0, 3);
    const brandCode = brand ? brand.toUpperCase().substring(0, 3) : 'GEN';
    const modelCode = model ? model.toUpperCase().replace(/[^A-Z0-9]/g, '') : 'STD';
    const timestamp = Date.now().toString().slice(-4);
    
    return `${categoryCode}-${brandCode}-${modelCode}-${timestamp}`;
  };

  // Suggest item code (helper function)
  const suggestItemCode = () => {
    if (itemFormData.category && itemFormData.brand && itemFormData.model) {
      const suggested = generateItemCode(
        itemFormData.category,
        itemFormData.brand,
        itemFormData.model
      );
      setItemFormData(prev => ({ ...prev, itemCode: suggested }));
    }
  };

  // Reset form
  const resetItemForm = () => {
    setItemFormData({
      itemCode: '',
      itemName: '',
      description: '',
      category: 'turbo',
      subcategory: '',
      brand: '',
      model: '',
      compatibleVehicles: [''],
      unitOfMeasure: 'piece',
      minimumStock: 5,
      maximumStock: 100,
      reorderLevel: 10,
      storageLocation: '',
      barcode: '',
      notes: '',
      isActive: true
    });
    setEditingItem(null);
    setShowItemForm(false);
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setItemFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle compatible vehicles
  const addCompatibleVehicle = () => {
    setItemFormData(prev => ({
      ...prev,
      compatibleVehicles: [...prev.compatibleVehicles, '']
    }));
  };

  const removeCompatibleVehicle = (index: number) => {
    setItemFormData(prev => ({
      ...prev,
      compatibleVehicles: prev.compatibleVehicles.filter((_, i) => i !== index)
    }));
  };

  const updateCompatibleVehicle = (index: number, value: string) => {
    setItemFormData(prev => ({
      ...prev,
      compatibleVehicles: prev.compatibleVehicles.map((vehicle, i) => 
        i === index ? value : vehicle
      )
    }));
  };

  // Submit item form
  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (!itemFormData.itemCode.trim()) {
        toast.error('Item code is required');
        return;
      }
      if (!itemFormData.itemName.trim()) {
        toast.error('Item name is required');
        return;
      }

      // Check for duplicate item code (only for new items)
      if (!editingItem) {
        const existingItem = items.find(item => 
          item.itemCode.toLowerCase() === itemFormData.itemCode.toLowerCase()
        );
        if (existingItem) {
          toast.error('Item code already exists');
          return;
        }
      }

      const itemData = {
        itemCode: itemFormData.itemCode.trim(),
        itemName: itemFormData.itemName.trim(),
        description: itemFormData.description.trim(),
        category: itemFormData.category,
        subcategory: itemFormData.subcategory.trim() || null,
        brand: itemFormData.brand.trim() || null,
        model: itemFormData.model.trim() || null,
        compatibleVehicles: itemFormData.compatibleVehicles.filter(v => v.trim()),
        specifications: {},
        unitOfMeasure: itemFormData.unitOfMeasure,
        minimumStock: itemFormData.minimumStock,
        maximumStock: itemFormData.maximumStock,
        reorderLevel: itemFormData.reorderLevel,
        storageLocation: itemFormData.storageLocation.trim() || null,
        barcode: itemFormData.barcode.trim() || null,
        images: [],
        notes: itemFormData.notes.trim() || null,
        isActive: itemFormData.isActive,
        updatedAt: new Date()
      };

      if (editingItem) {
        await updateDoc(doc(db, 'items', editingItem.id), itemData);
        toast.success('Item updated successfully!');
      } else {
        await addDoc(collection(db, 'items'), {
          ...itemData,
          createdAt: new Date()
        });
        toast.success('Item added successfully!');
      }

      resetItemForm();
      loadItems();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit item
  const editItem = (item: Item) => {
    setItemFormData({
      itemCode: item.itemCode,
      itemName: item.itemName,
      description: item.description,
      category: item.category,
      subcategory: item.subcategory || '',
      brand: item.brand || '',
      model: item.model || '',
      compatibleVehicles: item.compatibleVehicles.length > 0 ? item.compatibleVehicles : [''],
      unitOfMeasure: item.unitOfMeasure,
      minimumStock: item.minimumStock,
      maximumStock: item.maximumStock,
      reorderLevel: item.reorderLevel,
      storageLocation: item.storageLocation || '',
      barcode: item.barcode || '',
      notes: item.notes || '',
      isActive: item.isActive
    });
    setEditingItem(item);
    setShowItemForm(true);
  };

  // Delete item
  const deleteItem = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'items', itemId));
        toast.success('Item deleted successfully!');
        loadItems();
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error('Failed to delete item');
      }
    }
  };

  // View item details with history
  const viewItemDetails = (item: Item) => {
    setSelectedItem(item);
    setShowItemDetails(true);
    loadItemHistory(item.id, item.itemName);
  };

  // View profit analysis
  const viewProfitAnalysis = async (item: Item) => {
    setSelectedItem(item);
    setIsLoadingProfit(true);
    setShowProfitAnalysis(true);
    
    try {
      const profitData = await getItemProfitAnalysis(item.id);
      setProfitAnalysisData(profitData);
    } catch (error) {
      console.error('Error loading profit analysis:', error);
      toast.error('Failed to load profit analysis');
    } finally {
      setIsLoadingProfit(false);
    }
  };

  // View purchase history
  const viewPurchaseHistory = (item: Item) => {
    setSelectedItem(item);
    setShowPurchaseHistory(true);
    loadItemHistory(item.id, item.itemName);
  };

  // Get category info
  const getCategoryInfo = (category: string) => {
    return categories.find(cat => cat.value === category) || categories[categories.length - 1];
  };

  // Load purchase and sale history for a specific item
  const loadItemHistory = async (itemId: string, itemName: string) => {
    try {
      // Load purchase history
      const purchasesQuery = query(collection(db, 'purchases'), orderBy('purchaseDate', 'desc'));
      const purchasesSnapshot = await getDocs(purchasesQuery);
      
      const purchaseHistory: ItemPurchaseHistory[] = [];
      purchasesSnapshot.docs.forEach(doc => {
        const purchase = {
          id: doc.id,
          ...doc.data(),
          purchaseDate: doc.data().purchaseDate?.toDate() || new Date()
        } as Purchase;
        
        // Find items in this purchase that match our item
        purchase.items.forEach(item => {
          const linkedItemId = (item as any).itemId;
          const itemNameMatch = item.itemName.toLowerCase() === itemName.toLowerCase();
          
          if (linkedItemId === itemId || itemNameMatch) {
            purchaseHistory.push({
              purchaseId: purchase.id,
              supplierName: purchase.supplierName,
              supplierPhone: purchase.supplierPhone,
              quantity: item.quantity,
              costPerUnit: item.costPerUnit,
              totalCost: item.totalCost,
              purchaseDate: purchase.purchaseDate,
              notes: purchase.notes
            });
          }
        });
      });
      
      // Load sale history
      const salesQuery = query(collection(db, 'sales'), orderBy('saleDate', 'desc'));
      const salesSnapshot = await getDocs(salesQuery);
      
      const saleHistory: ItemSaleHistory[] = [];
      salesSnapshot.docs.forEach(doc => {
        const sale = {
          id: doc.id,
          ...doc.data(),
          saleDate: doc.data().saleDate?.toDate() || new Date()
        } as Sale;
        
        // Find items in this sale that match our item
        sale.items.forEach(item => {
          const linkedItemId = (item as any).itemId;
          const itemNameMatch = item.itemName.toLowerCase() === itemName.toLowerCase();
          
          if (linkedItemId === itemId || itemNameMatch) {
            saleHistory.push({
              saleId: sale.id,
              customerName: sale.customerName,
              customerPhone: sale.customerPhone,
              quantity: item.quantity,
              pricePerUnit: item.pricePerUnit,
              totalPrice: item.totalPrice,
              saleDate: sale.saleDate,
              notes: sale.notes
            });
          }
        });
      });
      
      setItemPurchaseHistory(purchaseHistory);
      setItemSaleHistory(saleHistory);
    } catch (error) {
      console.error('Error loading item history:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading items...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Item Management</h2>
          <p className="text-sm sm:text-base text-gray-600">Manage your complete item catalog</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={async () => {
              if (confirm('This will completely reset and recalculate all stock data from scratch. Continue?')) {
                try {
                  toast.loading('Resetting all stock data...');
                  await resetAllStockData();
                  await loadStockSummary();
                  toast.dismiss();
                  toast.success('All stock data reset and recalculated successfully!');
                } catch (error) {
                  toast.dismiss();
                  toast.error('Failed to reset stock data');
                  console.error('Reset error:', error);
                }
              }
            }}
            className="btn-secondary flex items-center space-x-2 bg-red-50 text-red-700 hover:bg-red-100 text-xs sm:text-sm px-2 sm:px-3 py-2"
          >
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={async () => {
              try {
                toast.loading('Recalculating all stock data...');
                await recalculateAllItemStocks();
                await loadStockSummary();
                toast.dismiss();
                toast.success('All stock data recalculated successfully!');
              } catch (error) {
                toast.dismiss();
                toast.error('Failed to recalculate stock data');
                console.error('Recalculate error:', error);
              }
            }}
            className="btn-secondary flex items-center space-x-2 text-xs sm:text-sm px-2 sm:px-3 py-2"
          >
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Fix</span>
          </button>
          <button
            onClick={async () => {
              try {
                await loadStockSummary();
                toast.success('Stock data refreshed');
              } catch (error) {
                toast.error('Failed to refresh stock data');
                console.error('Refresh error:', error);
              }
            }}
            className="btn-secondary flex items-center space-x-2 text-xs sm:text-sm px-2 sm:px-3 py-2"
          >
            <Package className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowItemForm(true)}
            className="btn-primary flex items-center space-x-2 text-xs sm:text-sm px-3 sm:px-4 py-2"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Tabs - Mobile Responsive */}
      <div className="flex overflow-x-auto bg-gray-100 p-1 rounded-lg" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <button
          onClick={() => setActiveTab('items')}
          className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-md font-medium transition-colors text-sm whitespace-nowrap ${
            activeTab === 'items'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Package className="h-4 w-4 inline mr-2" />
          Items ({filteredItems.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-md font-medium transition-colors text-sm whitespace-nowrap ${
            activeTab === 'categories'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Tag className="h-4 w-4 inline mr-2" />
          Categories
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-md font-medium transition-colors text-sm whitespace-nowrap ${
            activeTab === 'stock'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="h-4 w-4 inline mr-2" />
          Stock Overview
        </button>
      </div>

      {/* Items Tab */}
      {activeTab === 'items' && (
        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by item code, name, brand, model, or compatible vehicles..."
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              {searchTerm && (
                <div className="absolute right-3 top-3.5">
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
              
              <button className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const categoryInfo = getCategoryInfo(item.category);
              const itemStock = stockSummary.find(stock => stock.itemId === item.id);
              return (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                          {categoryInfo.icon} {categoryInfo.label}
                        </span>
                        {!item.isActive && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            <Archive className="h-3 w-3 inline mr-1" />
                            Inactive
                          </span>
                        )}
                        {itemStock && itemStock.currentStock > 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            {itemStock.currentStock} in stock
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{item.itemName}</h3>
                      <p className="text-sm text-gray-600 mb-2">Code: {item.itemCode}</p>
                      {item.brand && (
                        <p className="text-sm text-gray-500">Brand: {item.brand}</p>
                      )}
                      {item.model && (
                        <p className="text-sm text-gray-500">Model: {item.model}</p>
                      )}
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => viewItemDetails(item)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => viewProfitAnalysis(item)}
                        className="p-2 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50"
                        title="Profit Analysis"
                      >
                        <DollarSign className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => viewPurchaseHistory(item)}
                        className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50"
                        title="Purchase History"
                      >
                        <History className="h-4 w-4" />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const debug = await debugItemStock(item.id, item.itemName);
                            console.log('Debug result:', debug);
                            toast.success(`Debug complete. Expected stock: ${debug.expectedStock}. Check console for details.`);
                          } catch (error) {
                            toast.error('Debug failed');
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-orange-600 rounded-lg hover:bg-orange-50"
                        title="Debug Stock"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => editItem(item)}
                        className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50"
                        title="Edit Item"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Delete Item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                    
                    {item.compatibleVehicles.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Compatible Vehicles:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.compatibleVehicles.slice(0, 3).map((vehicle, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {vehicle}
                            </span>
                          ))}
                          {item.compatibleVehicles.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              +{item.compatibleVehicles.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        <span className="flex items-center">
                          <Package className="h-3 w-3 mr-1" />
                          Min: {item.minimumStock} | Max: {item.maximumStock}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Unit: {item.unitOfMeasure}
                      </div>
                    </div>

                    {/* Stock Information */}
                    {itemStock && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Current Stock:</span>
                            <p className="font-medium text-blue-600">{itemStock.currentStock}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Total Purchased:</span>
                            <p className="font-medium text-green-600">{itemStock.totalPurchased}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Total Sold:</span>
                            <p className="font-medium text-red-600">{itemStock.totalSold}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Avg Cost:</span>
                            <p className="font-medium text-gray-900">Rs {itemStock.averageCostPrice.toFixed(0)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg font-medium">No items found</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm || categoryFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start by adding your first item to the catalog'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(category => {
            const categoryItems = items.filter(item => item.category === category.value);
            return (
              <div key={category.value} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{category.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.label}</h3>
                      <p className="text-sm text-gray-500">{categoryItems.length} items</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${category.color}`}>
                    {categoryItems.length}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Active Items:</span>
                    <span className="font-medium text-green-600">
                      {categoryItems.filter(item => item.isActive).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Inactive Items:</span>
                    <span className="font-medium text-red-600">
                      {categoryItems.filter(item => !item.isActive).length}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCategoryFilter(category.value);
                    setActiveTab('items');
                  }}
                  className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  View Items
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Stock Overview Tab - Enhanced Modern UI */}
      {activeTab === 'stock' && (
        <div className="space-y-6">
          {stockSummary.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="h-10 w-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Stock Overview</h3>
                <p className="text-gray-500 mb-4">
                  Stock tracking will be available once you start making purchases
                </p>
                <button
                  onClick={() => setActiveTab('items')}
                  className="btn-primary"
                >
                  Add Items First
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Stock Summary</h3>
                      <p className="text-sm text-gray-600">Current stock levels for all items</p>
                    </div>
                  </div>
                  <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">
                    {stockSummary.length} items tracked
                  </div>
                </div>
              </div>
              
              {/* Mobile-First Responsive Table */}
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  {/* Mobile Card View (Hidden on Desktop) */}
                  <div className="block lg:hidden space-y-4 p-4">
                    {stockSummary.map((stock, index) => (
                      <div key={stock.itemId} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm">{stock.itemName}</h4>
                            <p className="text-xs text-gray-500 font-mono">{stock.itemCode}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            stock.currentStock > 5 ? 'bg-green-100 text-green-700' :
                            stock.currentStock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {stock.currentStock > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <div className="font-bold text-blue-600">{stock.currentStock}</div>
                            <div className="text-xs text-gray-600">Current Stock</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded">
                            <div className="font-bold text-green-600">{stock.totalPurchased}</div>
                            <div className="text-xs text-gray-600">Purchased</div>
                          </div>
                          <div className="text-center p-2 bg-red-50 rounded">
                            <div className="font-bold text-red-600">{stock.totalSold}</div>
                            <div className="text-xs text-gray-600">Sold</div>
                          </div>
                          <div className="text-center p-2 bg-purple-50 rounded">
                            <div className="font-bold text-purple-600">Rs {stock.totalCostValue.toFixed(0)}</div>
                            <div className="text-xs text-gray-600">Stock Value</div>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
                          <div>
                            <span className="text-gray-600">Avg Cost: </span>
                            <span className="font-medium">Rs {stock.averageCostPrice.toFixed(0)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Profit: </span>
                            <span className={`font-medium ${stock.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Rs {stock.totalProfit.toFixed(0)} ({stock.profitMargin.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (Hidden on Mobile) */}
                  <table className="hidden lg:table min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Item Details
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Current Stock
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Purchased
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Sold
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Avg Cost
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Stock Value
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Total Profit
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Profit Margin
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stockSummary.map((stock, index) => (
                        <tr key={stock.itemId} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-1">
                                  <p className="text-sm font-semibold text-gray-900">{stock.itemName}</p>
                                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                    stock.currentStock > 5 ? 'bg-green-100 text-green-700' :
                                    stock.currentStock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                    {stock.currentStock > 0 ? 'In Stock' : 'Out of Stock'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                    {stock.itemCode}
                                  </span>
                                  <span className="text-xs text-gray-500 capitalize">
                                    {stock.category}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className={`text-lg font-bold ${
                                stock.currentStock > 5 ? 'text-green-600' :
                                stock.currentStock > 0 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {stock.currentStock}
                              </span>
                              <span className="text-xs text-gray-500">units</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-semibold text-green-600">
                                {stock.totalPurchased}
                              </span>
                              <span className="text-xs text-gray-500">total</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-semibold text-red-600">
                                {stock.totalSold}
                              </span>
                              <span className="text-xs text-gray-500">total</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-semibold text-gray-900">
                                Rs {stock.averageCostPrice.toFixed(0)}
                              </span>
                              <span className="text-xs text-gray-500">per unit</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-bold text-purple-600">
                                Rs {stock.totalCostValue.toFixed(0)}
                              </span>
                              <span className="text-xs text-gray-500">total value</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className={`text-sm font-bold ${
                                stock.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                Rs {stock.totalProfit.toFixed(0)}
                              </span>
                              <span className="text-xs text-gray-500">total profit</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className={`text-sm font-bold ${
                                stock.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {stock.profitMargin.toFixed(1)}%
                              </span>
                              <span className="text-xs text-gray-500">margin</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Enhanced Summary Cards */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200 p-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-blue-100">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {stockSummary.reduce((sum, item) => sum + item.currentStock, 0)}
                    </div>
                    <div className="text-xs font-medium text-gray-600">Total Items in Stock</div>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-green-100">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {stockSummary.reduce((sum, item) => sum + item.totalPurchased, 0)}
                    </div>
                    <div className="text-xs font-medium text-gray-600">Total Purchased</div>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-red-100">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-600 mb-1">
                      {stockSummary.reduce((sum, item) => sum + item.totalSold, 0)}
                    </div>
                    <div className="text-xs font-medium text-gray-600">Total Sold</div>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm border border-purple-100">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <DollarSign className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      Rs {stockSummary.reduce((sum, item) => sum + item.totalCostValue, 0).toFixed(0)}
                    </div>
                    <div className="text-xs font-medium text-gray-600">Total Stock Value</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Item Form Modal */}
      {showItemForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </h2>
                <button
                  onClick={resetItemForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleItemSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Code *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={itemFormData.itemCode}
                        onChange={(e) => handleInputChange('itemCode', e.target.value.toUpperCase())}
                        required
                        className="input-field flex-1"
                        placeholder="e.g., GT3576, HX40, T250"
                      />
                      <button
                        type="button"
                        onClick={suggestItemCode}
                        className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                        title="Generate suggested code"
                      >
                        Suggest
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter your own code for easy searching (e.g., GT3576, HX40, T250)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      value={itemFormData.itemName}
                      onChange={(e) => handleInputChange('itemName', e.target.value)}
                      required
                      className="input-field"
                      placeholder="e.g., GT3576 Turbocharger"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={itemFormData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="input-field"
                      placeholder="Detailed description of the item..."
                    />
                  </div>
                </div>

                {/* Category and Classification */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={itemFormData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      required
                      className="input-field"
                    >
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.icon} {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={itemFormData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      className="input-field"
                      placeholder="e.g., Garrett, Holset"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model
                    </label>
                    <input
                      type="text"
                      value={itemFormData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      className="input-field"
                      placeholder="e.g., GT3576, HX40"
                    />
                  </div>
                </div>

                {/* Compatible Vehicles */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Compatible Vehicles
                    </label>
                    <button
                      type="button"
                      onClick={addCompatibleVehicle}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      + Add Vehicle
                    </button>
                  </div>
                  <div className="space-y-2">
                    {itemFormData.compatibleVehicles.map((vehicle, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={vehicle}
                          onChange={(e) => updateCompatibleVehicle(index, e.target.value)}
                          className="flex-1 input-field"
                          placeholder="e.g., Toyota Hilux 2.5L Diesel"
                        />
                        {itemFormData.compatibleVehicles.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCompatibleVehicle(index)}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stock Settings */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit of Measure
                    </label>
                    <select
                      value={itemFormData.unitOfMeasure}
                      onChange={(e) => handleInputChange('unitOfMeasure', e.target.value)}
                      className="input-field"
                    >
                      <option value="piece">Piece</option>
                      <option value="kg">Kilogram</option>
                      <option value="liter">Liter</option>
                      <option value="meter">Meter</option>
                      <option value="set">Set</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Stock
                    </label>
                    <input
                      type="number"
                      value={itemFormData.minimumStock}
                      onChange={(e) => handleInputChange('minimumStock', parseInt(e.target.value) || 0)}
                      min="0"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Stock
                    </label>
                    <input
                      type="number"
                      value={itemFormData.maximumStock}
                      onChange={(e) => handleInputChange('maximumStock', parseInt(e.target.value) || 0)}
                      min="0"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reorder Level
                    </label>
                    <input
                      type="number"
                      value={itemFormData.reorderLevel}
                      onChange={(e) => handleInputChange('reorderLevel', parseInt(e.target.value) || 0)}
                      min="0"
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Additional Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Storage Location
                    </label>
                    <input
                      type="text"
                      value={itemFormData.storageLocation}
                      onChange={(e) => handleInputChange('storageLocation', e.target.value)}
                      className="input-field"
                      placeholder="e.g., Warehouse A, Shelf 3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={itemFormData.barcode}
                      onChange={(e) => handleInputChange('barcode', e.target.value)}
                      className="input-field"
                      placeholder="Barcode number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={itemFormData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className="input-field"
                    placeholder="Additional notes about this item..."
                  />
                </div>

                {/* Active Status */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={itemFormData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Item is active and available for purchase/sale
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetItemForm}
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
                        {editingItem ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      editingItem ? 'Update Item' : 'Add Item'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Item Details Modal */}
      {showItemDetails && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Item Details</h2>
                <button
                  onClick={() => setShowItemDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Item Code:</span>
                        <p className="text-gray-900">{selectedItem.itemCode}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Item Name:</span>
                        <p className="text-gray-900">{selectedItem.itemName}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Category:</span>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getCategoryInfo(selectedItem.category).color}`}>
                          {getCategoryInfo(selectedItem.category).icon} {getCategoryInfo(selectedItem.category).label}
                        </span>
                      </div>
                      {selectedItem.brand && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Brand:</span>
                          <p className="text-gray-900">{selectedItem.brand}</p>
                        </div>
                      )}
                      {selectedItem.model && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Model:</span>
                          <p className="text-gray-900">{selectedItem.model}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Settings</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Unit of Measure:</span>
                        <p className="text-gray-900 capitalize">{selectedItem.unitOfMeasure}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Minimum Stock:</span>
                        <p className="text-gray-900">{selectedItem.minimumStock}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Maximum Stock:</span>
                        <p className="text-gray-900">{selectedItem.maximumStock}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Reorder Level:</span>
                        <p className="text-gray-900">{selectedItem.reorderLevel}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Status:</span>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          selectedItem.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedItem.isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <Archive className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedItem.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700">{selectedItem.description}</p>
                  </div>
                )}

                {/* Compatible Vehicles */}
                {selectedItem.compatibleVehicles.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Compatible Vehicles</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.compatibleVehicles.map((vehicle, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {vehicle}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedItem.storageLocation && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Storage Location:</span>
                      <p className="text-gray-900">{selectedItem.storageLocation}</p>
                    </div>
                  )}
                  {selectedItem.barcode && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Barcode:</span>
                      <p className="text-gray-900 font-mono">{selectedItem.barcode}</p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {selectedItem.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
                    <p className="text-gray-700">{selectedItem.notes}</p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Created:</span> {selectedItem.createdAt.toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span> {selectedItem.updatedAt.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={() => setShowItemDetails(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowItemDetails(false);
                    editItem(selectedItem);
                  }}
                  className="btn-primary"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase History Modal */}
      {showPurchaseHistory && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Purchase & Sale History</h2>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">
                    {selectedItem.itemCode} - {selectedItem.itemName}
                  </p>
                </div>
                <button
                  onClick={() => setShowPurchaseHistory(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-blue-800">Total Purchased</p>
                      <p className="text-lg sm:text-xl font-bold text-blue-900">
                        {itemPurchaseHistory.reduce((sum, p) => sum + p.quantity, 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-green-800">Purchase Value</p>
                      <p className="text-lg sm:text-xl font-bold text-green-900">
                        {formatPrice(itemPurchaseHistory.reduce((sum, p) => sum + p.totalCost, 0))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-purple-600 mr-2" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-purple-800">Total Sold</p>
                      <p className="text-lg sm:text-xl font-bold text-purple-900">
                        {itemSaleHistory.reduce((sum, s) => sum + s.quantity, 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-orange-600 mr-2" />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-orange-800">Sale Value</p>
                      <p className="text-lg sm:text-xl font-bold text-orange-900">
                        {formatPrice(itemSaleHistory.reduce((sum, s) => sum + s.totalPrice, 0))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Purchase History */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                      <Truck className="h-5 w-5 text-blue-600 mr-2" />
                      Purchase History ({itemPurchaseHistory.length})
                    </h3>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {itemPurchaseHistory.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {itemPurchaseHistory.map((purchase, index) => (
                          <div key={index} className="p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {purchase.supplierName}
                                </p>
                                <p className="text-xs text-gray-500">{purchase.supplierPhone}</p>
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                <p className="text-sm font-semibold text-blue-600">
                                  {purchase.quantity} units
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatPrice(purchase.costPerUnit)} each
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {purchase.purchaseDate.toLocaleDateString()}
                              </div>
                              <div className="font-medium text-gray-900">
                                Total: {formatPrice(purchase.totalCost)}
                              </div>
                            </div>
                            
                            {purchase.notes && (
                              <p className="text-xs text-gray-600 mt-2 italic">
                                Note: {purchase.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <Truck className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No purchase history</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sale History */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                      <User className="h-5 w-5 text-green-600 mr-2" />
                      Sale History ({itemSaleHistory.length})
                    </h3>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {itemSaleHistory.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {itemSaleHistory.map((sale, index) => (
                          <div key={index} className="p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {sale.customerName}
                                </p>
                                <p className="text-xs text-gray-500">{sale.customerPhone}</p>
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                <p className="text-sm font-semibold text-green-600">
                                  {sale.quantity} units
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatPrice(sale.pricePerUnit)} each
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {sale.saleDate.toLocaleDateString()}
                              </div>
                              <div className="font-medium text-gray-900">
                                Total: {formatPrice(sale.totalPrice)}
                              </div>
                            </div>
                            
                            {sale.notes && (
                              <p className="text-xs text-gray-600 mt-2 italic">
                                Note: {sale.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No sale history</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Supplier Summary */}
              {itemPurchaseHistory.length > 0 && (
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="text-base font-semibold text-gray-900 mb-3">Supplier Summary</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(
                      itemPurchaseHistory.reduce((acc, purchase) => {
                        const key = purchase.supplierName;
                        if (!acc[key]) {
                          acc[key] = {
                            name: purchase.supplierName,
                            phone: purchase.supplierPhone,
                            totalQuantity: 0,
                            totalCost: 0,
                            purchaseCount: 0,
                            lastPurchase: purchase.purchaseDate
                          };
                        }
                        acc[key].totalQuantity += purchase.quantity;
                        acc[key].totalCost += purchase.totalCost;
                        acc[key].purchaseCount += 1;
                        if (purchase.purchaseDate > acc[key].lastPurchase) {
                          acc[key].lastPurchase = purchase.purchaseDate;
                        }
                        return acc;
                      }, {} as any)
                    ).map(([key, supplier]: [string, any]) => (
                      <div key={key} className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="font-medium text-gray-900 text-sm truncate">{supplier.name}</p>
                        <p className="text-xs text-gray-500 mb-2">{supplier.phone}</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Units:</span>
                            <span className="font-medium text-blue-600">{supplier.totalQuantity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Cost:</span>
                            <span className="font-medium text-green-600">{formatPrice(supplier.totalCost)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Orders:</span>
                            <span className="font-medium">{supplier.purchaseCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Last Purchase:</span>
                            <span className="font-medium">{supplier.lastPurchase.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowPurchaseHistory(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profit Analysis Modal */}
      {showProfitAnalysis && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">💰 Profit Analysis</h2>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">
                    {selectedItem.itemCode} - {selectedItem.itemName}
                  </p>
                </div>
                <button
                  onClick={() => setShowProfitAnalysis(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {isLoadingProfit ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                  <span className="ml-3 text-gray-600">Loading profit analysis...</span>
                </div>
              ) : profitAnalysisData ? (
                <div className="space-y-6">
                  {/* Profit Summary Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-green-800">Total Profit</p>
                          <p className="text-lg sm:text-xl font-bold text-green-900">
                            {formatPrice(profitAnalysisData.profitBreakdown.summary.totalProfit)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-blue-800">Profit Margin</p>
                          <p className="text-lg sm:text-xl font-bold text-blue-900">
                            {profitAnalysisData.profitBreakdown.summary.profitMargin.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                          <Package className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-purple-800">Profit Per Unit</p>
                          <p className="text-lg sm:text-xl font-bold text-purple-900">
                            {formatPrice(profitAnalysisData.profitBreakdown.summary.profitPerUnit)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                          <BarChart3 className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-orange-800">Units Sold</p>
                          <p className="text-lg sm:text-xl font-bold text-orange-900">
                            {profitAnalysisData.profitBreakdown.summary.totalSold}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Overview */}
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Financial Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <p className="text-sm text-gray-600 mb-1">Total Purchase Cost</p>
                        <p className="text-xl font-bold text-red-600">
                          {formatPrice(profitAnalysisData.profitBreakdown.summary.totalPurchaseCost)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Avg: {formatPrice(profitAnalysisData.profitBreakdown.summary.averageCostPrice)} per unit
                        </p>
                      </div>
                      
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <p className="text-sm text-gray-600 mb-1">Total Sale Revenue</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatPrice(profitAnalysisData.profitBreakdown.summary.totalSaleRevenue)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Avg: {formatPrice(profitAnalysisData.profitBreakdown.summary.averageSalePrice)} per unit
                        </p>
                      </div>
                      
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <p className="text-sm text-gray-600 mb-1">Net Profit</p>
                        <p className={`text-xl font-bold ${
                          profitAnalysisData.profitBreakdown.summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPrice(profitAnalysisData.profitBreakdown.summary.totalProfit)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {profitAnalysisData.profitBreakdown.summary.profitMargin.toFixed(1)}% margin
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Purchase Transactions */}
                    <div className="bg-white border border-gray-200 rounded-lg">
                      <div className="bg-red-50 p-4 border-b border-red-200">
                        <h3 className="text-base sm:text-lg font-semibold text-red-800 flex items-center">
                          <Truck className="h-5 w-5 text-red-600 mr-2" />
                          Purchase Transactions ({profitAnalysisData.profitBreakdown.purchaseTransactions.length})
                        </h3>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                        {profitAnalysisData.profitBreakdown.purchaseTransactions.length > 0 ? (
                          <div className="divide-y divide-gray-200">
                            {profitAnalysisData.profitBreakdown.purchaseTransactions.map((transaction: any, index: number) => (
                              <div key={index} className="p-4 hover:bg-gray-50">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {transaction.supplier}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {transaction.date.toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-2">
                                    <p className="text-sm font-semibold text-red-600">
                                      {transaction.quantity} units
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatPrice(transaction.costPerUnit)} each
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600">Total Cost:</span>
                                  <span className="font-medium text-red-700">
                                    {formatPrice(transaction.totalCost)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-gray-500">
                            <Truck className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No purchase transactions</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sale Transactions */}
                    <div className="bg-white border border-gray-200 rounded-lg">
                      <div className="bg-green-50 p-4 border-b border-green-200">
                        <h3 className="text-base sm:text-lg font-semibold text-green-800 flex items-center">
                          <User className="h-5 w-5 text-green-600 mr-2" />
                          Sale Transactions ({profitAnalysisData.profitBreakdown.saleTransactions.length})
                        </h3>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto">
                        {profitAnalysisData.profitBreakdown.saleTransactions.length > 0 ? (
                          <div className="divide-y divide-gray-200">
                            {profitAnalysisData.profitBreakdown.saleTransactions.map((transaction: any, index: number) => (
                              <div key={index} className="p-4 hover:bg-gray-50">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {transaction.customer}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {transaction.date.toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-2">
                                    <p className="text-sm font-semibold text-green-600">
                                      {transaction.quantity} units
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatPrice(transaction.pricePerUnit)} each
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="space-y-1 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Sale Price:</span>
                                    <span className="font-medium text-green-700">
                                      {formatPrice(transaction.totalPrice)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Cost Price:</span>
                                    <span className="font-medium text-red-600">
                                      {formatPrice(transaction.costPerUnit * transaction.quantity)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between border-t border-gray-200 pt-1">
                                    <span className="text-gray-600 font-medium">Profit:</span>
                                    <span className={`font-bold ${
                                      transaction.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {formatPrice(transaction.totalProfit)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-gray-500">
                            <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No sale transactions</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No profit data available</p>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowProfitAnalysis(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}