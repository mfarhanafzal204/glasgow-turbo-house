'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, Order, CustomTurboOrder, Purchase, Sale, Supplier, Customer, FinancialTransaction } from '@/types';
import ProductManagement from './ProductManagement';
import OrderManagement from './OrderManagement';
import CustomOrderManagement from './CustomOrderManagement';
import ContactMessageManagement from './ContactMessageManagement';
import IntegratedPurchaseManagement from './IntegratedPurchaseManagement';
import IntegratedSalesManagement from './IntegratedSalesManagement';
import InventoryDashboard from './InventoryDashboard';
import FinancialManagement from './FinancialManagement';
import ItemManagement from './ItemManagement';
import BillingManagement from './BillingManagement';
import BarcodeManagement from './BarcodeManagement';
import { 
  Package, 
  ShoppingCart, 
  FileText, 
  LogOut,
  TrendingUp,
  ShoppingBag,
  Truck,
  BarChart3,
  DollarSign,
  MessageSquare,
  Tag,
  Receipt,
  QrCode
} from 'lucide-react';

interface ContactMessage {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomTurboOrder[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch products
      const productsRef = collection(db, 'products');
      const productsQuery = query(productsRef, orderBy('createdAt', 'desc'));
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Product[];

      // Fetch orders
      const ordersRef = collection(db, 'orders');
      const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Order[];

      // Fetch custom orders
      const customOrdersRef = collection(db, 'customOrders');
      const customOrdersQuery = query(customOrdersRef, orderBy('createdAt', 'desc'));
      const customOrdersSnapshot = await getDocs(customOrdersQuery);
      const customOrdersData = customOrdersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as CustomTurboOrder[];

      // Fetch purchases
      const purchasesRef = collection(db, 'purchases');
      const purchasesQuery = query(purchasesRef, orderBy('createdAt', 'desc'));
      const purchasesSnapshot = await getDocs(purchasesQuery);
      const purchasesData = purchasesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        purchaseDate: doc.data().purchaseDate?.toDate() || new Date(),
      })) as Purchase[];

      // Fetch sales
      const salesRef = collection(db, 'sales');
      const salesQuery = query(salesRef, orderBy('createdAt', 'desc'));
      const salesSnapshot = await getDocs(salesQuery);
      const salesData = salesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        saleDate: doc.data().saleDate?.toDate() || new Date(),
      })) as Sale[];

      // Fetch suppliers
      const suppliersRef = collection(db, 'suppliers');
      const suppliersQuery = query(suppliersRef, orderBy('createdAt', 'desc'));
      const suppliersSnapshot = await getDocs(suppliersQuery);
      const suppliersData = suppliersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Supplier[];

      // Fetch customers
      const customersRef = collection(db, 'customers');
      const customersQuery = query(customersRef, orderBy('createdAt', 'desc'));
      const customersSnapshot = await getDocs(customersQuery);
      const customersData = customersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Customer[];

      // Fetch financial transactions
      const financialTransactionsRef = collection(db, 'financialTransactions');
      const financialTransactionsQuery = query(financialTransactionsRef, orderBy('createdAt', 'desc'));
      const financialTransactionsSnapshot = await getDocs(financialTransactionsQuery);
      const financialTransactionsData = financialTransactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        transactionDate: doc.data().transactionDate?.toDate() || new Date(),
      })) as FinancialTransaction[];

      // Fetch contact messages
      try {
        const contactMessagesRef = collection(db, 'contactMessages');
        const contactMessagesQuery = query(contactMessagesRef, orderBy('createdAt', 'desc'));
        const contactMessagesSnapshot = await getDocs(contactMessagesQuery);
        console.log('Contact messages found:', contactMessagesSnapshot.size);
        
        const contactMessagesData = contactMessagesSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Contact message data:', data);
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Date ? data.createdAt : (data.createdAt?.toDate() || new Date()),
            updatedAt: data.updatedAt instanceof Date ? data.updatedAt : (data.updatedAt?.toDate() || new Date()),
          };
        }) as ContactMessage[];
        
        setContactMessages(contactMessagesData);
        console.log('Contact messages set:', contactMessagesData.length);
      } catch (contactError) {
        console.error('Error fetching contact messages:', contactError);
        setContactMessages([]); // Set empty array on error
      }

      setProducts(productsData);
      setOrders(ordersData);
      setCustomOrders(customOrdersData);
      setPurchases(purchasesData);
      setSales(salesData);
      setSuppliers(suppliersData);
      setCustomers(customersData);
      setFinancialTransactions(financialTransactionsData);
      // contactMessages is set in the try-catch block above
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const totalRevenue = orders
    .filter(order => order.status !== 'pending')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const pendingCustomOrders = customOrders.filter(order => order.status === 'pending').length;
  const newMessages = contactMessages.filter(message => message.status === 'new').length;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'items', label: 'Items', icon: Tag },
    { id: 'inventory', label: 'Inventory', icon: BarChart3 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'purchases', label: 'Purchases', icon: Truck },
    { id: 'sales', label: 'Sales', icon: ShoppingBag },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'custom-orders', label: 'Custom', icon: FileText },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'barcodes', label: 'Barcodes', icon: QrCode },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Responsive Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">GT</span>
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Glasgow Turbo House</p>
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="flex items-center space-x-1 sm:space-x-2 text-gray-700 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Enhanced Navigation Tabs - Multi-breakpoint Responsive */}
        <div className="border-b border-gray-200 mb-4 sm:mb-6 lg:mb-8">
          <nav className="-mb-px">
            {/* Large Desktop: Full tabs with wrapping */}
            <div className="hidden xl:block">
              <div className="flex flex-wrap gap-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const hasNotification = 
                    (tab.id === 'orders' && pendingOrders > 0) ||
                    (tab.id === 'custom-orders' && pendingCustomOrders > 0) ||
                    (tab.id === 'messages' && newMessages > 0);
                  
                  const notificationCount = 
                    tab.id === 'orders' ? pendingOrders :
                    tab.id === 'custom-orders' ? pendingCustomOrders :
                    tab.id === 'messages' ? newMessages : 0;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 bg-blue-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      } transition-all duration-200 rounded-t-lg`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">
                        {tab.label}
                      </span>
                      {hasNotification && (
                        <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-5 h-5 flex items-center justify-center font-medium animate-pulse">
                          {notificationCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Medium Desktop & Tablet: Horizontal scroll */}
            <div className="hidden sm:block xl:hidden">
              <div className="flex overflow-x-auto scrollbar-hide pb-1">
                <div className="flex space-x-1 min-w-max px-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const hasNotification = 
                      (tab.id === 'orders' && pendingOrders > 0) ||
                      (tab.id === 'custom-orders' && pendingCustomOrders > 0) ||
                      (tab.id === 'messages' && newMessages > 0);
                    
                    const notificationCount = 
                      tab.id === 'orders' ? pendingOrders :
                      tab.id === 'custom-orders' ? pendingCustomOrders :
                      tab.id === 'messages' ? newMessages : 0;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex items-center space-x-2 py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap flex-shrink-0 ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600 bg-blue-50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        } transition-all duration-200 rounded-t-lg`}
                        style={{ minWidth: 'fit-content' }}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm whitespace-nowrap">
                          {tab.label}
                        </span>
                        {hasNotification && (
                          <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-5 h-5 flex items-center justify-center font-medium animate-pulse">
                            {notificationCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Mobile: Compact horizontal scroll */}
            <div className="block sm:hidden">
              <div className="flex overflow-x-auto scrollbar-hide pb-1">
                <div className="flex space-x-1 min-w-max px-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const hasNotification = 
                      (tab.id === 'orders' && pendingOrders > 0) ||
                      (tab.id === 'custom-orders' && pendingCustomOrders > 0) ||
                      (tab.id === 'messages' && newMessages > 0);
                    
                    const notificationCount = 
                      tab.id === 'orders' ? pendingOrders :
                      tab.id === 'custom-orders' ? pendingCustomOrders :
                      tab.id === 'messages' ? newMessages : 0;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex flex-col items-center justify-center space-y-1 py-2 px-2 border-b-2 font-medium text-xs whitespace-nowrap flex-shrink-0 ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600 bg-blue-50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        } transition-all duration-200 rounded-t-lg`}
                        style={{ minWidth: '65px' }}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-xs leading-tight text-center">
                          {tab.label}
                        </span>
                        {hasNotification && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-4 h-4 flex items-center justify-center font-medium animate-pulse">
                            {notificationCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </nav>
        </div>

        {/* Mobile-First Overview Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Mobile-Optimized Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  </div>
                  <div className="ml-2 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Products</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{products.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                  <div className="ml-2 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Orders</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{orders.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  </div>
                  <div className="ml-2 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Custom</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{customOrders.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                  </div>
                  <div className="ml-2 sm:ml-4 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Revenue</p>
                    <p className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900">
                      PKR {(totalRevenue / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile-First Recent Activity */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Orders</h3>
                </div>
                <div className="p-4 sm:p-6">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-100 last:border-b-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{order.customerName}</p>
                        <p className="text-xs sm:text-sm text-gray-500">PKR {order.totalAmount.toLocaleString()}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ml-2 ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <p className="text-gray-500 text-center py-4 text-sm">No orders yet</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Custom Orders</h3>
                </div>
                <div className="p-4 sm:p-6">
                  {customOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-100 last:border-b-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{order.customerName}</p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{order.turboName}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ml-2 ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'quoted' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'confirmed' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  ))}
                  {customOrders.length === 0 && (
                    <p className="text-gray-500 text-center py-4 text-sm">No custom orders yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <ItemManagement 
            suppliers={suppliers}
            onSuppliersChange={fetchData}
          />
        )}

        {activeTab === 'products' && (
          <ProductManagement products={products} onProductsChange={fetchData} />
        )}

        {activeTab === 'inventory' && (
          <InventoryDashboard 
            purchases={purchases}
            sales={sales}
            suppliers={suppliers}
            customers={customers}
          />
        )}

        {activeTab === 'purchases' && (
          <IntegratedPurchaseManagement 
            purchases={purchases}
            suppliers={suppliers}
            onPurchasesChange={fetchData}
            onSuppliersChange={fetchData}
          />
        )}

        {activeTab === 'sales' && (
          <IntegratedSalesManagement 
            sales={sales}
            customers={customers}
            purchases={purchases}
            onSalesChange={fetchData}
            onCustomersChange={fetchData}
          />
        )}

        {activeTab === 'orders' && (
          <OrderManagement orders={orders} onOrdersChange={fetchData} />
        )}

        {activeTab === 'custom-orders' && (
          <CustomOrderManagement customOrders={customOrders} onOrdersChange={fetchData} />
        )}

        {activeTab === 'messages' && (
          <ContactMessageManagement messages={contactMessages} onMessagesChange={fetchData} />
        )}

        {activeTab === 'financial' && (
          <FinancialManagement 
            transactions={financialTransactions}
            onTransactionsChange={fetchData}
          />
        )}

        {activeTab === 'billing' && (
          <BillingManagement products={products} />
        )}

        {activeTab === 'barcodes' && (
          <BarcodeManagement products={products} />
        )}
      </div>
    </div>
  );
}