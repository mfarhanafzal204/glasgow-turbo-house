'use client';

import Link from 'next/link';
import { ShoppingCart, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/types';
import { formatPrice, calculateDiscount, generateSlug } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { getSafeImageUrl } from '@/lib/imageUpload';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const discount = calculateDiscount(product.originalPrice, product.discountedPrice);
  const productSlug = generateSlug(product.name);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Create image array with both turbo and car images
  const images = [
    getSafeImageUrl(product.turboImage, 'turbo'),
    getSafeImageUrl(product.compatibleCarImage, 'car')
  ].filter(Boolean);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast.success('Added to cart!');
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleIndicatorClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  return (
    <div className="product-card group bg-white rounded-lg sm:rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      <div className="relative">
        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 sm:px-3 sm:py-1 rounded-full z-20 shadow-lg">
            -{discount}%
          </div>
        )}
        
        {/* Stock Status */}
        {!product.inStock && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-gray-500 text-white text-xs font-bold px-2 py-1 sm:px-3 sm:py-1 rounded-full z-20 shadow-lg">
            Out of Stock
          </div>
        )}

        {/* Image Carousel */}
        <div className="aspect-square relative overflow-hidden bg-gray-100 cursor-pointer">
          <Link href={`/product/${productSlug}`}>
            <img
              src={images[currentImageIndex]}
              alt={currentImageIndex === 0 ? `${product.name} turbo` : `Compatible car for ${product.name}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </Link>
          
          {/* Image Navigation - Only show on larger screens */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 sm:p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-70 z-30"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 sm:p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-70 z-30"
                aria-label="Next image"
              >
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
              
              {/* Image Indicators */}
              <div className="absolute bottom-2 sm:bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-2 z-30">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => handleIndicatorClick(e, index)}
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors duration-300 ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Hover Overlay - Hidden on mobile */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 items-center justify-center z-20 hidden sm:flex">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-3">
              <Link
                href={`/product/${productSlug}`}
                className="bg-white text-gray-800 p-3 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <Eye className="h-5 w-5" />
              </Link>
              <button 
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="bg-primary-600 text-white p-3 rounded-full hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg"
              >
                <ShoppingCart className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-5">
        {/* Product Name - Clickable */}
        <Link href={`/product/${productSlug}`}>
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 hover:text-primary-600 transition-colors text-sm sm:text-lg cursor-pointer">
            {product.name}
          </h3>
        </Link>

        {/* Compatible Vehicles - Hide on very small screens */}
        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 bg-gray-50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg hidden xs:block">
          <span className="font-medium">Compatible:</span> {product.compatibleVehicles.slice(0, 1).join(', ')}
          {product.compatibleVehicles.length > 1 && ` +${product.compatibleVehicles.length - 1} more`}
        </p>

        {/* Description - Hide on mobile */}
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed hidden sm:block">
          {product.description}
        </p>

        {/* Pricing */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
            <span className="text-lg sm:text-xl font-bold text-primary-600">
              {formatPrice(product.discountedPrice)}
            </span>
            {product.originalPrice > product.discountedPrice && (
              <span className="text-xs sm:text-sm text-gray-500 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          {discount > 0 && (
            <span className="text-xs bg-red-100 text-red-800 px-1 sm:px-2 py-1 rounded-full font-medium">
              -{discount}%
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock}
          className="w-full btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400 py-2 sm:py-3 font-semibold text-xs sm:text-sm rounded-lg transition-all duration-300"
        >
          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}