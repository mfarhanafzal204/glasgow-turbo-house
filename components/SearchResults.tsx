'use client';

import { Product } from '@/types';
import ProductCard from './ProductCard';
import { Search } from 'lucide-react';

interface SearchResultsProps {
  products: Product[];
  searchTerm: string;
  totalProducts: number;
  loading?: boolean;
}

export default function SearchResults({ 
  products, 
  searchTerm, 
  totalProducts,
  loading = false 
}: SearchResultsProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (searchTerm && products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-white rounded-lg p-12 shadow-sm">
          <div className="mb-6">
            <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            No products found
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            We couldn't find any products matching "{searchTerm}". 
            Try adjusting your search terms or filters.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p><strong>Search tips:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Check your spelling</li>
              <li>Try more general terms</li>
              <li>Search by vehicle model (e.g., "Hilux", "Swift")</li>
              <li>Search by turbo type (e.g., "GT2860", "K04")</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search Results Header */}
      {searchTerm && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Search Results
          </h2>
          <p className="text-gray-600">
            Found {products.length} of {totalProducts} products for "{searchTerm}"
          </p>
        </div>
      )}

      {/* Products Grid - Fully responsive with equal height cards */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 auto-rows-fr">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="bg-white rounded-lg p-12 shadow-sm">
            <div className="mb-6">
              <div className="mx-auto h-24 w-24 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-4xl">🛒</span>
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              No products available
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Products will appear here once they are added to the store. Please check back later.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}