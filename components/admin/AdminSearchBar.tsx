'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Product, CustomTurboOrder } from '@/types';

interface AdminSearchBarProps {
  data: Product[] | CustomTurboOrder[];
  onSearch: (searchTerm: string) => void;
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  placeholder?: string;
  type: 'products' | 'orders';
}

export default function AdminSearchBar({ 
  data, 
  onSearch, 
  onSort,
  placeholder = "Search...",
  type 
}: AdminSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const searchRef = useRef<HTMLDivElement>(null);

  // Close filters when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    onSearch(term);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
  };

  const handleSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newOrder);
    onSort(field, newOrder);
  };

  const productSortOptions = [
    { value: 'name', label: 'Product Name' },
    { value: 'category', label: 'Category' },
    { value: 'discountedPrice', label: 'Price' },
    { value: 'createdAt', label: 'Date Added' },
    { value: 'inStock', label: 'Stock Status' }
  ];

  const orderSortOptions = [
    { value: 'customerName', label: 'Customer Name' },
    { value: 'turboName', label: 'Turbo Name' },
    { value: 'status', label: 'Status' },
    { value: 'createdAt', label: 'Date Created' },
    { value: 'estimatedPrice', label: 'Price' }
  ];

  const sortOptions = type === 'products' ? productSortOptions : orderSortOptions;

  return (
    <div className="relative" ref={searchRef}>
      <div className="flex gap-4 mb-6">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            placeholder={placeholder}
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Search Button */}
        <button
          onClick={() => handleSearch(searchTerm)}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Search
        </button>

        {/* Sort & Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Sort & Filter Panel */}
      {showFilters && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sort & Filter</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <div className="space-y-2">
                {sortOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleSort(option.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left border rounded-md transition-colors ${
                      sortBy === option.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span>{option.label}</span>
                    {sortBy === option.value && (
                      sortOrder === 'asc' ? 
                        <SortAsc className="h-4 w-4" /> : 
                        <SortDesc className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Stats
              </label>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total {type}:</span>
                  <span className="font-medium">{data.length}</span>
                </div>
                {type === 'products' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">In Stock:</span>
                      <span className="font-medium text-green-600">
                        {(data as Product[]).filter(p => p.inStock).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Out of Stock:</span>
                      <span className="font-medium text-red-600">
                        {(data as Product[]).filter(p => !p.inStock).length}
                      </span>
                    </div>
                  </>
                )}
                {type === 'orders' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pending:</span>
                      <span className="font-medium text-yellow-600">
                        {(data as CustomTurboOrder[]).filter(o => o.status === 'pending').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed:</span>
                      <span className="font-medium text-green-600">
                        {(data as CustomTurboOrder[]).filter(o => o.status === 'completed').length}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results Summary */}
      {searchTerm && (
        <div className="mb-4 text-sm text-gray-600">
          Showing results for "{searchTerm}"
        </div>
      )}
    </div>
  );
}