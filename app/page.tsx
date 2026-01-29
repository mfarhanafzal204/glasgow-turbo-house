'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import SearchBar from '@/components/SearchBar';
import SearchResults from '@/components/SearchResults';
import ClientWrapper from '@/components/ClientWrapper';
import WhatsAppButton from '@/components/WhatsAppButton';
import { Truck, Shield, Clock, Award } from 'lucide-react';
import { searchProducts, filterProducts, ProductFilters } from '@/lib/search';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ProductFilters>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  // Update filtered products when products, search term, or filters change
  useEffect(() => {
    let result = products;
    
    // Apply search
    if (searchTerm.trim()) {
      result = searchProducts(result, searchTerm);
    }
    
    // Apply filters
    result = filterProducts(result, filters);
    
    setFilteredProducts(result);
  }, [products, searchTerm, filters]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilter = (newFilters: ProductFilters) => {
    setFilters(newFilters);
  };

  const fetchProducts = async () => {
    try {
      // Check if Firebase is properly configured
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      if (!db || !apiKey || apiKey === 'demo-key') {
        console.warn('Firebase not configured properly. Please check your environment variables.');
        setError('Firebase not configured. Please complete the setup.');
        setProducts([]);
        return;
      }
      
      console.log('Fetching products from Firestore...');
      const productsRef = collection(db, 'products');
      
      // Simple query to get all products first
      const querySnapshot = await getDocs(productsRef);
      console.log('Raw products found:', querySnapshot.size);
      
      const productsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Product data:', data);
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }) as Product[];
      
      // Filter in-stock products on client side
      const inStockProducts = productsData.filter(product => product.inStock);
      console.log('In-stock products:', inStockProducts.length);
      
      // Sort by creation date (newest first)
      inStockProducts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setProducts(inStockProducts);
      setError(null); // Clear any previous errors
    } catch (err: any) {
      console.error('Error fetching products:', err);
      
      // Provide more specific error messages
      if (err.code === 'permission-denied') {
        setError('Database access denied. Please check Firestore security rules.');
      } else if (err.code === 'unavailable') {
        setError('Database temporarily unavailable. Please try again.');
      } else if (err.code === 'failed-precondition') {
        setError('Database index required. Using simple query instead.');
        // Fallback to simple query
        try {
          const productsRef = collection(db, 'products');
          const querySnapshot = await getDocs(productsRef);
          const productsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          })) as Product[];
          setProducts(productsData.filter(p => p.inStock));
          setError(null);
        } catch (fallbackErr) {
          console.error('Fallback query failed:', fallbackErr);
          setError('Failed to load products. Please try again.');
        }
      } else if (err.message?.includes('projectId')) {
        setError('Firebase project not found. Please check your configuration.');
      } else {
        setError('Failed to load products. Please check your Firebase setup.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientWrapper>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12 sm:py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
                Glasgow Turbo House (GDS)
              </h1>
              <h2 className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-primary-100">
                Pakistan's #1 Turbo Ecommerce Store
              </h2>
              <p className="text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
                Top turbo sellers in Multan offering professional turbo parts, diesel services, 
                and expert turbo installation across Pakistan. Your trusted GDS partner.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                <button className="bg-white text-primary-600 font-semibold py-3 px-6 sm:px-8 rounded-lg hover:bg-gray-100 transition-colors w-full sm:w-auto">
                  Shop Turbo Parts
                </button>
                <button className="border-2 border-white text-white font-semibold py-3 px-6 sm:px-8 rounded-lg hover:bg-white hover:text-primary-600 transition-colors w-full sm:w-auto">
                  Custom Turbo Order
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="bg-primary-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">Fast Delivery</h3>
                <p className="text-sm sm:text-base text-gray-600">Quick delivery across Pakistan</p>
              </div>
              <div className="text-center">
                <div className="bg-primary-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">Quality Assured</h3>
                <p className="text-sm sm:text-base text-gray-600">Genuine turbo parts only</p>
              </div>
              <div className="text-center">
                <div className="bg-primary-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">24/7 Support</h3>
                <p className="text-sm sm:text-base text-gray-600">Round the clock assistance</p>
              </div>
              <div className="text-center">
                <div className="bg-primary-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Award className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">Expert Service</h3>
                <p className="text-sm sm:text-base text-gray-600">Professional turbo solutions</p>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Premium Turbo Parts & Services
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                Discover our wide range of quality turbo parts from GDS - Multan's top turbo dealers. 
                Professional turbo installation and diesel services across Pakistan.
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto mb-8">
                <SearchBar
                  products={products}
                  onSearch={handleSearch}
                  onFilter={handleFilter}
                  placeholder="Search turbos, vehicles, or parts..."
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-16">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-red-600 mb-4">{error}</p>
                <button 
                  onClick={fetchProducts}
                  className="btn-primary"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <SearchResults
                products={filteredProducts}
                searchTerm={searchTerm}
                totalProducts={products.length}
                loading={loading}
              />
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Need Custom Turbo Solutions from GDS?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Can't find what you're looking for? Our expert team at Glasgow Turbo House 
              can help you find or build the perfect turbo for your vehicle.
            </p>
            <a href="/custom-order" className="btn-primary bg-primary-600 hover:bg-primary-700">
              Get Custom Turbo Quote
            </a>
          </div>
        </section>
      </main>

        <Footer />
        <WhatsAppButton />
      </div>
    </ClientWrapper>
  );
}