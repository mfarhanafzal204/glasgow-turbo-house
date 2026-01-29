'use client';

import { useState, useEffect } from 'react';
import { Purchase, Sale, Supplier, Customer } from '@/types';
import { formatPrice } from '@/lib/utils';
import { getItemStockSummary, ItemStockSummary } from '@/lib/stockTracking';
import { 
  ShoppingCart, 
  ShoppingBag, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Package,
  AlertTriangle,
  X,
  DollarSign,
  BarChart3
} from 'lucide-react';

interface InventoryDashboardProps {
  purchases: Purchase[];
  sales: Sale[];
  suppliers: Supplier[];
  customers: Customer[];
}

export default function InventoryDashboard({ 
  purchases, 
  sales, 
  suppliers, 
  customers 
}: InventoryDashboardProps) {
  const [stockSummary, setStockSummary] = useState<ItemStockSummary[]>([]);
  const [isLoadingStock, setIsLoadingStock] = useState(true);
  const [showAllOutOfStock, setShowAllOutOfStock] = useState(false);
  const [showAllLowStock, setShowAllLowStock] = useState(false);
  const [showAllStockItems, setShowAllStockItems] = useState(false);

  // Load stock summary
  useEffect(() => {
    const loadStockSummary = async () => {
      try {
        setIsLoadingStock(true);
        const stockData = await getItemStockSummary();
        setStockSummary(stockData);
      } catch (error) {
        console.error('Error loading stock summary:', error);
      } finally {
        setIsLoadingStock(false);
      }
    };

    loadStockSummary();
  }, [purchases, sales]);

  // Calculate statistics
  const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalProfit = totalSales - totalPurchases;
  const profitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100) : 0;

  // Stock statistics
  const totalStockValue = stockSummary.reduce((sum, item) => sum + item.totalCostValue, 0);
  const totalItemsInStock = stockSummary.reduce((sum, item) => sum + item.currentStock, 0);
  const lowStockItems = stockSummary.filter(item => item.currentStock > 0 && item.currentStock <= 5);
  const outOfStockItems = stockSummary.filter(item => item.currentStock === 0);

  // Recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentPurchases = purchases.filter(p => p.purchaseDate >= thirtyDaysAgo);
  const recentSales = sales.filter(s => s.saleDate >= thirtyDaysAgo);
  
  const recentPurchasesTotal = recentPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const recentSalesTotal = recentSales.reduce((sum, s) => sum + s.totalAmount, 0);

  // Top suppliers and customers
  const supplierStats = suppliers.map(supplier => {
    const supplierPurchases = purchases.filter(p => p.supplierId === supplier.id);
    const totalAmount = supplierPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalOrders = supplierPurchases.length;
    return { ...supplier, totalAmount, totalOrders };
  }).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 5);

  const customerStats = customers.map(customer => {
    const customerSales = sales.filter(s => s.customerId === customer.id);
    const totalAmount = customerSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalOrders = customerSales.length;
    return { ...customer, totalAmount, totalOrders };
  }).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 5);

  // Monthly trends (last 6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const monthPurchases = purchases.filter(p => 
      p.purchaseDate >= monthStart && p.purchaseDate <= monthEnd
    ).reduce((sum, p) => sum + p.totalAmount, 0);

    const monthSales = sales.filter(s => 
      s.saleDate >= monthStart && s.saleDate <= monthEnd
    ).reduce((sum, s) => sum + s.totalAmount, 0);

    monthlyData.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      purchases: monthPurchases,
      sales: monthSales,
      profit: monthSales - monthPurchases
    });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile-First Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
        {/* Total Purchases */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-red-600" />
              </div>
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Purchases</p>
              <p className="text-sm sm:text-lg lg:text-2xl font-semibold text-gray-900">
                {formatPrice(totalPurchases)}
              </p>
              <p className="text-xs text-gray-500 hidden sm:block">
                {purchases.length} transactions
              </p>
            </div>
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-green-600" />
              </div>
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Sales</p>
              <p className="text-sm sm:text-lg lg:text-2xl font-semibold text-gray-900">
                {formatPrice(totalSales)}
              </p>
              <p className="text-xs text-gray-500 hidden sm:block">
                {sales.length} transactions
              </p>
            </div>
          </div>
        </div>

        {/* Total Profit */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${
                totalProfit >= 0 ? 'bg-blue-100' : 'bg-red-100'
              }`}>
                {totalProfit >= 0 ? (
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-blue-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-red-600" />
                )}
              </div>
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Profit</p>
              <p className={`text-sm sm:text-lg lg:text-2xl font-semibold ${
                totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPrice(totalProfit)}
              </p>
              <p className="text-xs text-gray-500 hidden sm:block">
                {profitMargin.toFixed(1)}% margin
              </p>
            </div>
          </div>
        </div>

        {/* Stock Value */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Stock Value</p>
              <p className="text-sm sm:text-lg lg:text-2xl font-semibold text-gray-900">
                {formatPrice(totalStockValue)}
              </p>
              <p className="text-xs text-gray-500 hidden sm:block">
                {totalItemsInStock} items
              </p>
            </div>
          </div>
        </div>

        {/* Profit Per Item */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-indigo-600" />
              </div>
            </div>
            <div className="ml-2 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Profit/Item</p>
              <p className="text-sm sm:text-lg lg:text-2xl font-semibold text-indigo-600">
                {formatPrice(sales.length > 0 ? totalProfit / sales.length : 0)}
              </p>
              <p className="text-xs text-gray-500 hidden sm:block">
                per transaction
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Alerts - Enhanced Modern UI */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {lowStockItems.length > 0 && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-yellow-800">Low Stock Alert</h3>
                    <p className="text-xs sm:text-sm text-yellow-600">Items running low</p>
                  </div>
                </div>
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
                  {lowStockItems.length}
                </div>
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {lowStockItems.slice(0, 4).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-yellow-900 truncate">{item.itemName}</p>
                      <p className="text-xs text-yellow-700">{item.itemCode}</p>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                        {item.currentStock} left
                      </span>
                    </div>
                  </div>
                ))}
                {lowStockItems.length > 4 && (
                  <button 
                    onClick={() => setShowAllLowStock(true)}
                    className="w-full text-center py-2 text-xs text-yellow-700 hover:text-yellow-800 font-medium bg-white/40 rounded-lg hover:bg-white/60 transition-colors"
                  >
                    +{lowStockItems.length - 4} more items - Click to view all
                  </button>
                )}
              </div>
            </div>
          )}

          {outOfStockItems.length > 0 && (
            <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-red-800">Out of Stock</h3>
                    <p className="text-xs sm:text-sm text-red-600">Items need restocking</p>
                  </div>
                </div>
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                  {outOfStockItems.length}
                </div>
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {outOfStockItems.slice(0, 4).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-900 truncate">{item.itemName}</p>
                      <p className="text-xs text-red-700">{item.itemCode}</p>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
                        0 units
                      </span>
                    </div>
                  </div>
                ))}
                {outOfStockItems.length > 4 && (
                  <button 
                    onClick={() => setShowAllOutOfStock(true)}
                    className="w-full text-center py-2 text-xs text-red-700 hover:text-red-800 font-medium bg-white/40 rounded-lg hover:bg-white/60 transition-colors"
                  >
                    +{outOfStockItems.length - 4} more items - Click to view all
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity & Stock Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Recent Activity (30 days)
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-red-50 rounded-lg">
              <div className="flex items-center min-w-0">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mr-2 sm:mr-3 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">Purchases</p>
                  <p className="text-xs sm:text-sm text-gray-500">{recentPurchases.length} transactions</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">
                  {formatPrice(recentPurchasesTotal)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg">
              <div className="flex items-center min-w-0">
                <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-2 sm:mr-3 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">Sales</p>
                  <p className="text-xs sm:text-sm text-gray-500">{recentSales.length} transactions</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">
                  {formatPrice(recentSalesTotal)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center min-w-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">Net Profit</p>
                  <p className="text-xs sm:text-sm text-gray-500">Last 30 days</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className={`font-semibold text-sm sm:text-base ${
                  (recentSalesTotal - recentPurchasesTotal) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPrice(recentSalesTotal - recentPurchasesTotal)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Overview - Enhanced Modern UI */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Stock Overview</h3>
                <p className="text-xs sm:text-sm text-gray-500">Current inventory levels</p>
              </div>
            </div>
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
              {stockSummary.length} items
            </div>
          </div>
          
          {isLoadingStock ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-sm text-gray-600">Loading stock data...</span>
            </div>
          ) : stockSummary.length > 0 ? (
            <div className="space-y-3">
              {stockSummary.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.itemName}</p>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        item.currentStock > 5 ? 'bg-green-100 text-green-700' :
                        item.currentStock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.currentStock > 0 ? `${item.currentStock} units` : 'Out of stock'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="font-mono bg-gray-200 px-2 py-1 rounded">{item.itemCode}</span>
                      <span>Value: {formatPrice(item.totalCostValue)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <div className="flex flex-col items-end space-y-1">
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-green-600">↗ {item.totalPurchased}</span>
                        <span className="text-red-600">↘ {item.totalSold}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {stockSummary.length > 5 && (
                <div className="border-t border-gray-200 pt-3">
                  <button 
                    onClick={() => setShowAllStockItems(true)}
                    className="w-full text-center py-3 text-sm text-gray-600 hover:text-gray-800 font-medium bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 hover:border-gray-300"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Package className="h-4 w-4" />
                      <span>View all {stockSummary.length - 5} more items</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">No stock data available</p>
              <p className="text-xs text-gray-400">Start by adding items and making purchases</p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trends - Mobile Optimized */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          Monthly Trends
        </h3>
        <div className="space-y-2 sm:space-y-3">
          {monthlyData.map((month, index) => (
            <div key={index} className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{month.month}</p>
                <div className="flex flex-col sm:flex-row sm:space-x-4 text-xs text-gray-500">
                  <span>Sales: {formatPrice(month.sales)}</span>
                  <span>Purchases: {formatPrice(month.purchases)}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className={`text-sm font-semibold ${
                  month.profit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPrice(month.profit)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profit Analysis Overview */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-green-900">💰 Profit Analysis</h3>
              <p className="text-xs sm:text-sm text-green-700">Business performance overview</p>
            </div>
          </div>
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
            {profitMargin.toFixed(1)}% margin
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {/* Gross Profit */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-200">
            <div className="flex items-center mb-2">
              <DollarSign className="h-4 w-4 text-green-600 mr-2" />
              <p className="text-xs sm:text-sm font-medium text-green-800">Gross Profit</p>
            </div>
            <p className={`text-lg sm:text-xl font-bold ${
              totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPrice(totalProfit)}
            </p>
            <p className="text-xs text-green-600">
              {totalSales > 0 ? `${((totalProfit / totalSales) * 100).toFixed(1)}% of sales` : '0% of sales'}
            </p>
          </div>

          {/* Average Profit Per Sale */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-200">
            <div className="flex items-center mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600 mr-2" />
              <p className="text-xs sm:text-sm font-medium text-green-800">Avg Profit/Sale</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-blue-600">
              {formatPrice(sales.length > 0 ? totalProfit / sales.length : 0)}
            </p>
            <p className="text-xs text-green-600">
              per transaction
            </p>
          </div>

          {/* Best Month */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-200">
            <div className="flex items-center mb-2">
              <Calendar className="h-4 w-4 text-purple-600 mr-2" />
              <p className="text-xs sm:text-sm font-medium text-green-800">Best Month</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-purple-600">
              {monthlyData.length > 0 
                ? monthlyData.reduce((best, month) => month.profit > best.profit ? month : best).month
                : 'N/A'
              }
            </p>
            <p className="text-xs text-green-600">
              {monthlyData.length > 0 
                ? formatPrice(monthlyData.reduce((best, month) => month.profit > best.profit ? month : best).profit)
                : 'No data'
              }
            </p>
          </div>

          {/* Growth Trend */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-200">
            <div className="flex items-center mb-2">
              <BarChart3 className="h-4 w-4 text-orange-600 mr-2" />
              <p className="text-xs sm:text-sm font-medium text-green-800">Trend</p>
            </div>
            <p className={`text-lg sm:text-xl font-bold ${
              monthlyData.length >= 2 && monthlyData[monthlyData.length - 1].profit > monthlyData[monthlyData.length - 2].profit
                ? 'text-green-600' : 'text-red-600'
            }`}>
              {monthlyData.length >= 2 
                ? (monthlyData[monthlyData.length - 1].profit > monthlyData[monthlyData.length - 2].profit ? '↗' : '↘')
                : '→'
              }
            </p>
            <p className="text-xs text-green-600">
              {monthlyData.length >= 2 
                ? (monthlyData[monthlyData.length - 1].profit > monthlyData[monthlyData.length - 2].profit ? 'Growing' : 'Declining')
                : 'Stable'
              }
            </p>
          </div>
        </div>

        {/* Profit Breakdown */}
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">📊 Profit Breakdown</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Revenue (Sales):</span>
              <span className="font-semibold text-green-600">{formatPrice(totalSales)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Costs (Purchases):</span>
              <span className="font-semibold text-red-600">-{formatPrice(totalPurchases)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="text-gray-900">Net Profit:</span>
                <span className={totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatPrice(totalProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Partners - Mobile Optimized */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Suppliers */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Top Suppliers
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {supplierStats.length > 0 ? (
              supplierStats.map((supplier, index) => (
                <div key={supplier.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center min-w-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                      <span className="text-xs sm:text-sm font-medium text-gray-600">
                        {index + 1}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{supplier.name}</p>
                      <p className="text-xs text-gray-500">
                        {supplier.totalOrders} orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatPrice(supplier.totalAmount)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4 text-sm">No suppliers yet</p>
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Top Customers
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {customerStats.length > 0 ? (
              customerStats.map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center min-w-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                      <span className="text-xs sm:text-sm font-medium text-gray-600">
                        {index + 1}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{customer.name}</p>
                      <p className="text-xs text-gray-500">
                        {customer.totalOrders} orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatPrice(customer.totalAmount)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4 text-sm">No customers yet</p>
            )}
          </div>
        </div>
      </div>

      {/* All Out of Stock Items Modal */}
      {showAllOutOfStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-800">All Out of Stock Items</h3>
                    <p className="text-sm text-red-600">{outOfStockItems.length} items need restocking</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAllOutOfStock(false)}
                  className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {outOfStockItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-900 truncate">{item.itemName}</p>
                      <p className="text-xs text-red-700 font-mono">{item.itemCode}</p>
                      <p className="text-xs text-red-600 capitalize">{item.category}</p>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
                        0 units
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowAllOutOfStock(false)}
                className="w-full btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Low Stock Items Modal */}
      {showAllLowStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-yellow-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800">All Low Stock Items</h3>
                    <p className="text-sm text-yellow-600">{lowStockItems.length} items running low</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAllLowStock(false)}
                  className="text-yellow-500 hover:text-yellow-700 p-2 rounded-lg hover:bg-yellow-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lowStockItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-yellow-900 truncate">{item.itemName}</p>
                      <p className="text-xs text-yellow-700 font-mono">{item.itemCode}</p>
                      <p className="text-xs text-yellow-600 capitalize">{item.category}</p>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                        {item.currentStock} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowAllLowStock(false)}
                className="w-full btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Stock Items Modal */}
      {showAllStockItems && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800">All Stock Items</h3>
                    <p className="text-sm text-blue-600">{stockSummary.length} items in inventory</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAllStockItems(false)}
                  className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {stockSummary.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.itemName}</p>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          item.currentStock > 5 ? 'bg-green-100 text-green-700' :
                          item.currentStock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {item.currentStock > 0 ? `${item.currentStock} units` : 'Out of stock'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="font-mono bg-gray-200 px-2 py-1 rounded">{item.itemCode}</span>
                        <span>Value: {formatPrice(item.totalCostValue)}</span>
                        <span className="capitalize">{item.category}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <div className="flex flex-col items-end space-y-1">
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-green-600">↗ {item.totalPurchased}</span>
                          <span className="text-red-600">↘ {item.totalSold}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowAllStockItems(false)}
                className="w-full btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}