'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchBar from '@/components/SearchBar';
import SearchResults from '@/components/SearchResults';
import LoadingSpinner from '@/components/LoadingSpinner';
import ClientWrapper from '@/components/ClientWrapper';
import { searchProducts, filterProducts, ProductFilters } from '@/lib/search';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [filters, setFilters] = useState<ProductFilters>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  // Update filtered products when products, search term, or filters change
  useEffect(() => {
    let result = products.filter(product => product.inStock); // Only show in-stock products
    
    // Apply search
    if (searchTerm.trim()) {
      result = searchProducts(result, searchTerm);
    }
    
    // Apply filters
    result = filterProducts(result, filters);
    
    setFilteredProducts(result);
  }, [products, searchTerm, filters]);

  const fetchProducts = async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      if (!db || !apiKey || apiKey === 'demo-key') {
        setError('Firebase not configured. Please complete the setup.');
        setProducts([]);
        return;
      }
      
      const productsRef = collection(db, 'products');
      const querySnapshot = await getDocs(productsRef);
      
      const productsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }) as Product[];
      
      setProducts(productsData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // Update URL with search query
    const url = new URL(window.location.href);
    if (term.trim()) {
      url.searchParams.set('q', term);
    } else {
      url.searchParams.delete('q');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const handleFilter = (newFilters: ProductFilters) => {
    setFilters(newFilters);
  };

  return (
    <ClientWrapper>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Search Products
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Find the perfect turbo parts for your vehicle
            </p>
            
            {/* Search Bar */}
            <SearchBar
              products={products}
              onSearch={handleSearch}
              onFilter={handleFilter}
              placeholder="Search by product name, vehicle, category..."
            />
          </div>

          {/* Search Results */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-lg p-12 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Unable to Load Products
                </h3>
                <p className="text-red-600 mb-6">{error}</p>
                <button 
                  onClick={fetchProducts}
                  className="btn-primary"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <SearchResults
              products={filteredProducts}
              searchTerm={searchTerm}
              totalProducts={products.length}
              loading={loading}
            />
          )}

          {/* Search Tips */}
          {!loading && !error && (
            <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Search Tips
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Search by Vehicle</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• "Toyota Hilux" - Find parts for specific models</li>
                    <li>• "Suzuki Swift" - Search by car brand and model</li>
                    <li>• "Honda Civic" - Compatible vehicle search</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Search by Turbo Type</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• "GT2860" - Search by turbo model number</li>
                    <li>• "K04" - Find specific turbo types</li>
                    <li>• "Garrett" - Search by manufacturer</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Search by Category</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• "Turbocharger" - Main turbo units</li>
                    <li>• "Intercooler" - Cooling components</li>
                    <li>• "Wastegate" - Control components</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Search by Price</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• "50000" - Find products around this price</li>
                    <li>• Use price filters for exact ranges</li>
                    <li>• Sort by price to find best deals</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </ClientWrapper>
  );
}