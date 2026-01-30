'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product } from '@/types';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import ClientWrapper from '@/components/ClientWrapper';
import { useCart } from '@/hooks/useCart';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { ShoppingCart, ArrowLeft, Truck, Shield, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getSafeImageUrl } from '@/lib/imageUpload';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      if (!db) {
        setError('Database not configured');
        return;
      }

      const productsRef = collection(db, 'products');
      const querySnapshot = await getDocs(productsRef);
      
      // Find product by matching slug with product name
      const products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Product[];

      // Simple slug matching - convert product name to slug and compare
      const foundProduct = products.find(p => {
        const productSlug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return productSlug === slug;
      });

      if (foundProduct) {
        setProduct(foundProduct);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      toast.success('Added to cart!');
    }
  };

  const nextImage = () => {
    if (product) {
      const images = [product.turboImage, product.compatibleCarImage].filter(Boolean);
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (product) {
      const images = [product.turboImage, product.compatibleCarImage].filter(Boolean);
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  if (loading) {
    return (
      <ClientWrapper>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner size="lg" />
          </div>
          <Footer />
        </div>
      </ClientWrapper>
    );
  }

  if (error || !product) {
    return (
      <ClientWrapper>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
              <p className="text-gray-600 mb-8">The product you're looking for doesn't exist.</p>
              <Link href="/" className="btn-primary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Store
              </Link>
            </div>
          </div>
          <Footer />
        </div>
      </ClientWrapper>
    );
  }

  const discount = calculateDiscount(product.originalPrice, product.discountedPrice);

  return (
    <ClientWrapper>
      <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images with Carousel */}
          <div className="space-y-4">
            {(() => {
              const images = [
                { url: product.turboImage, type: 'turbo' as const, label: 'Turbo' },
                { url: product.compatibleCarImage, type: 'car' as const, label: 'Compatible Car' }
              ].filter(img => img.url);

              return (
                <>
                  <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 group">
                    <img
                      src={getSafeImageUrl(images[currentImageIndex]?.url, images[currentImageIndex]?.type || 'turbo')}
                      alt={`${product.name} - ${images[currentImageIndex]?.label || 'Product'}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    
                    {/* Discount Badge */}
                    {discount > 0 && (
                      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-red-500 text-white text-xs sm:text-sm font-bold px-2 py-1 sm:px-3 sm:py-1 rounded-full z-10">
                        -{discount}% OFF
                      </div>
                    )}

                    {/* Image Navigation */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-70"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-70"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        
                        {/* Image Indicators */}
                        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                          {images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                                index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Image Type Label */}
                  {images.length > 0 && (
                    <div className="text-center">
                      <span className="inline-block bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                        {images[currentImageIndex]?.label}
                      </span>
                    </div>
                  )}

                  {/* Thumbnail Navigation */}
                  {images.length > 1 && (
                    <div className="flex space-x-2 justify-center">
                      {images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                            index === currentImageIndex ? 'border-primary-500' : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={getSafeImageUrl(image.url, image.type)}
                            alt={image.label}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Product Info */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-base sm:text-lg text-gray-600">{product.category}</p>
            </div>

            {/* Pricing */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <span className="text-2xl sm:text-3xl font-bold text-primary-600">
                {formatPrice(product.discountedPrice)}
              </span>
              {product.originalPrice > product.discountedPrice && (
                <span className="text-lg sm:text-xl text-gray-500 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`font-medium ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Compatible Vehicles */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Compatible Vehicles</h3>
              <div className="flex flex-wrap gap-2">
                {product.compatibleVehicles.map((vehicle, index) => (
                  <span
                    key={index}
                    className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {vehicle}
                  </span>
                ))}
              </div>
            </div>

            {/* Add to Cart */}
            <div className="space-y-4">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="w-full btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 py-3"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>{product.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
              </button>
              
              <Link href="/" className="w-full btn-secondary flex items-center justify-center space-x-2 py-3">
                <ArrowLeft className="h-4 w-4" />
                <span>Continue Shopping</span>
              </Link>
            </div>

            {/* Features */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Truck className="h-5 w-5 text-primary-600" />
                  <span className="text-sm text-gray-600">Fast Delivery</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-primary-600" />
                  <span className="text-sm text-gray-600">Quality Assured</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-primary-600" />
                  <span className="text-sm text-gray-600">Expert Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
      </div>
    </ClientWrapper>
  );
}