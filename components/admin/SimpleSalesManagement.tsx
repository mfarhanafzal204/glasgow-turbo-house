'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

interface SimpleSalesManagementProps {
  sales: any[];
  customers: any[];
  onSalesChange: () => void;
  onCustomersChange: () => void;
}

export default function SimpleSalesManagement({ 
  sales, 
  customers, 
  onSalesChange, 
  onCustomersChange 
}: SimpleSalesManagementProps) {
  const [activeTab, setActiveTab] = useState<'sales' | 'customers'>('sales');

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
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add {activeTab === 'sales' ? 'Sale' : 'Customer'}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {activeTab === 'sales' ? 'Sales Management' : 'Customer Management'}
          </h3>
          <p className="text-gray-600 mb-6">
            {activeTab === 'sales' 
              ? `You have ${sales.length} sales recorded.`
              : `You have ${customers.length} customers in your database.`
            }
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <p className="text-green-800 font-medium mb-2">
              {activeTab === 'sales' ? 'Sales Management Features:' : 'Customer Management Features:'}
            </p>
            <ul className="text-green-700 text-sm space-y-1 list-disc list-inside">
              {activeTab === 'sales' ? (
                <>
                  <li>Record sales to customers</li>
                  <li>Track multiple items per sale</li>
                  <li>Monitor payment methods</li>
                  <li>Calculate revenue automatically</li>
                </>
              ) : (
                <>
                  <li>Manage customer contact information</li>
                  <li>Track customer purchase history</li>
                  <li>Regional customer analysis</li>
                  <li>Quick customer selection in sales</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}