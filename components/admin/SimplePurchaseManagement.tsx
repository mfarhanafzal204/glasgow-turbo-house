'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

interface SimplePurchaseManagementProps {
  purchases: any[];
  suppliers: any[];
  onPurchasesChange: () => void;
  onSuppliersChange: () => void;
}

export default function SimplePurchaseManagement({ 
  purchases, 
  suppliers, 
  onPurchasesChange, 
  onSuppliersChange 
}: SimplePurchaseManagementProps) {
  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases');

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
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add {activeTab === 'purchases' ? 'Purchase' : 'Supplier'}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {activeTab === 'purchases' ? 'Purchase Management' : 'Supplier Management'}
          </h3>
          <p className="text-gray-600 mb-6">
            {activeTab === 'purchases' 
              ? `You have ${purchases.length} purchases recorded.`
              : `You have ${suppliers.length} suppliers in your database.`
            }
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-blue-800 font-medium mb-2">
              {activeTab === 'purchases' ? 'Purchase Management Features:' : 'Supplier Management Features:'}
            </p>
            <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
              {activeTab === 'purchases' ? (
                <>
                  <li>Record purchases from suppliers</li>
                  <li>Track multiple items per purchase</li>
                  <li>Calculate total costs automatically</li>
                  <li>Search and filter purchases</li>
                </>
              ) : (
                <>
                  <li>Manage supplier contact information</li>
                  <li>Track supplier performance</li>
                  <li>Quick supplier selection in purchases</li>
                  <li>Maintain supplier database</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}