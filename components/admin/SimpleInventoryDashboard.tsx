'use client';

import { ShoppingCart, ShoppingBag, Users, TrendingUp } from 'lucide-react';

interface SimpleInventoryDashboardProps {
  purchases: any[];
  sales: any[];
  suppliers: any[];
  customers: any[];
}

export default function SimpleInventoryDashboard({ 
  purchases, 
  sales, 
  suppliers, 
  customers 
}: SimpleInventoryDashboardProps) {
  // Calculate basic statistics
  const totalPurchases = purchases.reduce((sum, purchase) => sum + (purchase.totalAmount || 0), 0);
  const totalSales = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  const totalProfit = totalSales - totalPurchases;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Purchases */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Purchases</p>
              <p className="text-2xl font-semibold text-gray-900">
                PKR {totalPurchases.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {purchases.length} transactions
              </p>
            </div>
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Sales</p>
              <p className="text-2xl font-semibold text-gray-900">
                PKR {totalSales.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {sales.length} transactions
              </p>
            </div>
          </div>
        </div>

        {/* Total Profit */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                totalProfit >= 0 ? 'bg-blue-100' : 'bg-red-100'
              }`}>
                <TrendingUp className={`h-5 w-5 ${
                  totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'
                }`} />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Profit</p>
              <p className={`text-2xl font-semibold ${
                totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                PKR {totalProfit.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : '0'}% margin
              </p>
            </div>
          </div>
        </div>

        {/* Active Partners */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Partners</p>
              <p className="text-2xl font-semibold text-gray-900">
                {suppliers.length + customers.length}
              </p>
              <p className="text-sm text-gray-500">
                {suppliers.length} suppliers, {customers.length} customers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Inventory Management Dashboard
          </h3>
          <p className="text-gray-600 mb-6">
            Complete overview of your business operations and financial performance.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="font-semibold text-blue-800 mb-2">Purchase Tracking</h4>
              <p className="text-blue-700 text-sm">
                Monitor all inventory purchases from suppliers with detailed cost analysis.
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="font-semibold text-green-800 mb-2">Sales Analytics</h4>
              <p className="text-green-700 text-sm">
                Track customer sales and revenue with comprehensive reporting.
              </p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h4 className="font-semibold text-purple-800 mb-2">Partner Management</h4>
              <p className="text-purple-700 text-sm">
                Manage relationships with suppliers and customers effectively.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}