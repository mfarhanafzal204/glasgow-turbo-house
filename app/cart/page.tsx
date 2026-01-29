'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2, ArrowLeft, CreditCard } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import ClientWrapper from '@/components/ClientWrapper';
import { useCart } from '@/hooks/useCart';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import { PAYMENT_INFO, CONTACT_INFO } from '@/lib/constants';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast, { Toaster } from 'react-hot-toast';

export default function CartPage() {
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    getTotalPrice, 
    getOriginalTotalPrice,
    clearCart 
  } = useCart();
  
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderData, setOrderData] = useState({
    customerName: '',
    phone: '',
    email: '',
    address: '',
    paymentMethod: '',
    paymentProof: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSavings = getOriginalTotalPrice() - getTotalPrice();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setOrderData(prev => ({
      ...prev,
      paymentProof: file
    }));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      if (!orderData.customerName.trim() || !orderData.phone.trim() || !orderData.email.trim() || 
          !orderData.address.trim() || !orderData.paymentMethod) {
        throw new Error('Please fill in all required fields');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(orderData.email.trim())) {
        throw new Error('Please enter a valid email address');
      }

      // Check if Firebase is configured
      if (!db) {
        throw new Error('Database connection not available. Please contact us directly.');
      }

      // Create order object with proper structure
      const order = {
        customerName: orderData.customerName.trim(),
        phone: orderData.phone.trim(),
        email: orderData.email.trim(),
        address: orderData.address.trim(),
        paymentMethod: orderData.paymentMethod,
        items: cartItems.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.discountedPrice,
          originalPrice: item.product.originalPrice,
          total: item.product.discountedPrice * item.quantity,
          turboImage: item.product.turboImage,
          compatibleVehicles: item.product.compatibleVehicles
        })),
        totalAmount: getTotalPrice(),
        originalTotal: getOriginalTotalPrice(),
        savings: totalSavings,
        status: 'pending',
        paymentStatus: 'pending',
        paymentProofSubmitted: !!orderData.paymentProof,
        paymentProofFileName: orderData.paymentProof?.name || null,
        paymentProofSize: orderData.paymentProof?.size || null,
        paymentProofType: orderData.paymentProof?.type || null,
        // Convert image to base64 for storage (since we're not using Firebase Storage)
        paymentProofData: orderData.paymentProof ? await convertFileToBase64(orderData.paymentProof) : null,
        orderDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Submitting order:', order);
      
      const docRef = await addDoc(collection(db, 'orders'), order);
      console.log('Order saved with ID:', docRef.id);
      
      toast.success('Order submitted successfully! We will contact you within 2-4 hours to confirm your order.');
      
      // Clear cart and close modal
      clearCart();
      setShowCheckout(false);
      
      // Reset form
      setOrderData({
        customerName: '',
        phone: '',
        email: '',
        address: '',
        paymentMethod: '',
        paymentProof: null
      });
    } catch (error: any) {
      console.error('Error submitting order:', error);
      
      if (error.code === 'permission-denied') {
        toast.error('⚠️ Database permission issue. Please apply the Firestore rules from FIRESTORE_RULES_FIX.md or contact us directly at ' + CONTACT_INFO.phones[0]);
      } else if (error.code === 'unavailable') {
        toast.error('Service temporarily unavailable. Please try again in a few minutes or call ' + CONTACT_INFO.phones[0]);
      } else if (error.code === 'failed-precondition') {
        toast.error('Database configuration issue. Please contact us directly at ' + CONTACT_INFO.phones[0]);
      } else if (error.message?.includes('required fields')) {
        toast.error(error.message);
      } else if (error.message?.includes('email')) {
        toast.error(error.message);
      } else if (error.message?.includes('Database connection')) {
        toast.error('Database connection issue. Please contact us directly at ' + CONTACT_INFO.phones[0]);
      } else {
        toast.error('Unable to submit order. Please call us directly at ' + CONTACT_INFO.phones[0] + ' or try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to get safe image URL
  const getSafeImageUrl = (url: string) => {
    if (!url) {
      return 'https://picsum.photos/80/80?random=1';
    }
    
    if (url.startsWith('/placeholder')) {
      return 'https://picsum.photos/80/80?random=2';
    }
    
    if (url.includes('google.com/imgres')) {
      return 'https://picsum.photos/80/80?random=3';
    }
    
    return url;
  };

  if (cartItems.length === 0) {
    return (
      <ClientWrapper>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="bg-white rounded-lg shadow-sm p-12">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
                <p className="text-gray-600 mb-8">
                  Looks like you haven't added any items to your cart yet.
                </p>
                <Link href="/" className="btn-primary">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </ClientWrapper>
    );
  }

  return (
    <ClientWrapper>
      <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Shopping Cart ({cartItems.length} items)
                  </h1>
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 text-sm font-medium self-start sm:self-auto"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => {
                  const discount = calculateDiscount(
                    item.product.originalPrice, 
                    item.product.discountedPrice
                  );

                  return (
                    <div key={item.id} className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                        <div className="flex-shrink-0 w-full sm:w-auto">
                          <img
                            src={getSafeImageUrl(item.product.turboImage || '')}
                            alt={item.product.name}
                            className="w-full sm:w-20 h-48 sm:h-20 rounded-lg object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0 w-full">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {item.product.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            Compatible: {item.product.compatibleVehicles.slice(0, 2).join(', ')}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="text-lg font-bold text-primary-600">
                              {formatPrice(item.product.discountedPrice)}
                            </span>
                            {item.product.originalPrice > item.product.discountedPrice && (
                              <>
                                <span className="text-sm text-gray-500 line-through">
                                  {formatPrice(item.product.originalPrice)}
                                </span>
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                  -{discount}% OFF
                                </span>
                              </>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-2 rounded-full hover:bg-gray-100 border border-gray-300"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="font-medium w-8 text-center text-lg">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-2 rounded-full hover:bg-gray-100 border border-gray-300"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">
                                  {formatPrice(item.product.discountedPrice * item.quantity)}
                                </p>
                                {item.product.originalPrice > item.product.discountedPrice && (
                                  <p className="text-sm text-gray-500 line-through">
                                    {formatPrice(item.product.originalPrice * item.quantity)}
                                  </p>
                                )}
                              </div>
                              
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-50"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(getOriginalTotalPrice())}</span>
                </div>
                
                {totalSavings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Savings</span>
                    <span className="font-medium">-{formatPrice(totalSavings)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-lg font-bold text-primary-600">
                      {formatPrice(getTotalPrice())}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowCheckout(true)}
                className="w-full btn-primary mb-4"
              >
                Proceed to Checkout
              </button>

              <p className="text-xs text-gray-500 text-center">
                Secure checkout with payment proof submission
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Professional Checkout Modal */}
        {showCheckout && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-gray-100">
              {/* Header with Gradient */}
              <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Secure Checkout</h2>
                    <p className="text-primary-100 text-sm mt-1">Complete your order with payment proof</p>
                  </div>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="text-white hover:text-primary-200 bg-white bg-opacity-20 rounded-full p-2 hover:bg-opacity-30 transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {/* Payment Methods Section */}
                <div>
                  <div className="flex items-center mb-6">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-2 rounded-lg mr-3">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Payment Methods</h3>
                      <p className="text-gray-600 text-sm">Choose your preferred payment option</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Meezan Bank Card */}
                    <div className="relative overflow-hidden rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 via-green-100 to-emerald-50 p-6 hover:border-green-300 transition-all duration-300 hover:shadow-lg">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 rounded-full -mr-10 -mt-10 opacity-30"></div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-12 h-8 bg-gradient-to-r from-green-600 to-green-700 rounded-lg mr-3 flex items-center justify-center shadow-md">
                              <svg viewBox="0 0 24 24" className="w-7 h-5 text-white fill-current">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                              </svg>
                            </div>
                            <h4 className="font-bold text-green-800 text-lg">Meezan Bank</h4>
                          </div>
                          <span className="text-xs bg-green-600 text-white px-3 py-1 rounded-full font-medium shadow-sm">
                            Recommended
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-green-800">
                          <div className="flex justify-between">
                            <span className="font-medium">Account Title:</span>
                            <span className="font-semibold">{PAYMENT_INFO.meezanBank.accountTitle}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Account Number:</span>
                            <span className="font-mono font-bold text-green-900">{PAYMENT_INFO.meezanBank.accountNumber}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* JazzCash Card */}
                    <div className="relative overflow-hidden rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-orange-100 to-amber-50 p-6 hover:border-orange-300 transition-all duration-300 hover:shadow-lg">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200 rounded-full -mr-10 -mt-10 opacity-30"></div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-12 h-8 bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg mr-3 flex items-center justify-center shadow-md">
                              <svg viewBox="0 0 24 24" className="w-7 h-5 text-white fill-current">
                                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                              </svg>
                            </div>
                            <h4 className="font-bold text-orange-800 text-lg">JazzCash</h4>
                          </div>
                          <span className="text-xs bg-orange-600 text-white px-3 py-1 rounded-full font-medium shadow-sm">
                            Mobile Wallet
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-orange-800">
                          <div className="flex justify-between">
                            <span className="font-medium">Account Title:</span>
                            <span className="font-semibold">{PAYMENT_INFO.jazzCash.accountTitle}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Mobile Number:</span>
                            <span className="font-mono font-bold text-orange-900">{PAYMENT_INFO.jazzCash.mobileNumber}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Total with Enhanced Design */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-lg font-semibold text-gray-700">Total Amount</span>
                      <p className="text-sm text-gray-500">Including all discounts</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-primary-600 block">
                        {formatPrice(getTotalPrice())}
                      </span>
                      {totalSavings > 0 && (
                        <span className="text-sm text-green-600 font-medium">
                          You save {formatPrice(totalSavings)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhanced Instructions */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                  <div className="flex items-start">
                    <div className="bg-blue-600 p-2 rounded-lg mr-4 flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900 mb-3 text-lg">Payment Instructions</h4>
                      <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                        <li className="flex items-start">
                          <span className="mr-2">1.</span>
                          <span>Transfer the exact amount <strong>{formatPrice(getTotalPrice())}</strong> to any of the above accounts</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">2.</span>
                          <span>Take a clear screenshot of the payment confirmation</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">3.</span>
                          <span>Fill out the form below and upload the payment proof</span>
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2">4.</span>
                          <span>We'll confirm your order within <strong>2-4 hours</strong></span>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Enhanced Payment Proof Form */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center mb-6">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-2 rounded-lg mr-3">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">Order Information</h4>
                      <p className="text-gray-600 text-sm">Please provide your details and payment proof</p>
                    </div>
                  </div>

                  <form onSubmit={handleOrderSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Customer Name *
                        </label>
                        <input
                          type="text"
                          name="customerName"
                          required
                          value={orderData.customerName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          required
                          value={orderData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          placeholder="03XX XXXXXXX"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={orderData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Delivery Address *
                      </label>
                      <textarea
                        name="address"
                        required
                        rows={3}
                        value={orderData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                        placeholder="Enter your complete delivery address with city and postal code"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Payment Method *
                      </label>
                      <select 
                        name="paymentMethod"
                        required 
                        value={orderData.paymentMethod}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      >
                        <option value="">Select payment method</option>
                        <option value="meezan-bank">Meezan Bank Transfer</option>
                        <option value="jazzcash">JazzCash Mobile Wallet</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Payment Proof Screenshot *
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          required
                          accept="image/*"
                          onChange={handleFileChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Upload clear screenshot of payment confirmation (JPG, PNG, max 10MB)
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-4">
                      <div className="flex items-start">
                        <div className="bg-yellow-500 p-1 rounded-full mr-3 flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-yellow-800 font-medium">
                            <strong>Verification Required:</strong> Your order will be processed after payment verification. 
                            We'll contact you within <strong>2-4 hours</strong> to confirm your order and provide tracking details.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 px-6 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Submitting Order...
                          </span>
                        ) : (
                          'Submit Order & Payment Proof'
                        )}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const message = encodeURIComponent(`Hi! I want to send payment proof for my order.\n\nOrder Details:\nTotal: ${formatPrice(getTotalPrice())}\nPayment Method: ${orderData.paymentMethod}\nCustomer: ${orderData.customerName}\n\nI will send the payment screenshot in the next message.`);
                          const whatsappUrl = `https://wa.me/923006348406?text=${message}`;
                          window.open(whatsappUrl, '_blank');
                        }}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                          </svg>
                          Send via WhatsApp
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <WhatsAppButton />
      <Toaster position="top-right" />
      </div>
    </ClientWrapper>
  );
}