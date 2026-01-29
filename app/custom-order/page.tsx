'use client';

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';
import ClientWrapper from '@/components/ClientWrapper';
import { CustomTurboOrder } from '@/types';
import { isValidEmail, isValidPhone } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CustomOrderPage() {
  const [formData, setFormData] = useState({
    turboName: '',
    compatibleVehicle: '',
    description: '',
    estimatedPrice: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!isValidEmail(formData.customerEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (!isValidPhone(formData.customerPhone)) {
      toast.error('Please enter a valid Pakistani phone number');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData: Omit<CustomTurboOrder, 'id'> = {
        turboName: formData.turboName,
        compatibleVehicle: formData.compatibleVehicle,
        description: formData.description,
        estimatedPrice: parseFloat(formData.estimatedPrice) || 0,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, 'customOrders'), orderData);
      
      toast.success('Custom order submitted successfully! We\'ll contact you soon.');
      
      // Reset form
      setFormData({
        turboName: '',
        compatibleVehicle: '',
        description: '',
        estimatedPrice: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
      });
    } catch (error) {
      console.error('Error submitting custom order:', error);
      toast.error('Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ClientWrapper>
      <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Custom Turbo Order
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Can't find the exact turbo you need? Submit your requirements and our experts 
            will help you find or build the perfect solution for your vehicle.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Turbo Details Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Turbo Requirements
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="turboName" className="block text-sm font-medium text-gray-700 mb-2">
                    Turbo Name/Model *
                  </label>
                  <input
                    type="text"
                    id="turboName"
                    name="turboName"
                    required
                    value={formData.turboName}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., GT2860RS, K04, etc."
                  />
                </div>

                <div>
                  <label htmlFor="compatibleVehicle" className="block text-sm font-medium text-gray-700 mb-2">
                    Compatible Vehicle *
                  </label>
                  <input
                    type="text"
                    id="compatibleVehicle"
                    name="compatibleVehicle"
                    required
                    value={formData.compatibleVehicle}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., Toyota Hilux 2020, Suzuki Swift, etc."
                  />
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Please provide detailed information about your turbo requirements, engine specifications, performance goals, etc."
                />
              </div>

              <div className="mt-6">
                <label htmlFor="estimatedPrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Range (PKR)
                </label>
                <input
                  type="number"
                  id="estimatedPrice"
                  name="estimatedPrice"
                  value={formData.estimatedPrice}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., 50000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Help us provide options within your budget
                </p>
              </div>
            </div>

            {/* Customer Details Section */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    required
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="customerPhone"
                    name="customerPhone"
                    required
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="03XX XXXXXXX"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="customerEmail"
                  name="customerEmail"
                  required
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Submitting Order...
                  </>
                ) : (
                  'Submit Custom Order'
                )}
              </button>
              
              <p className="text-sm text-gray-500 text-center mt-4">
                Our experts will review your requirements and contact you within 24 hours 
                with a detailed quote and availability information.
              </p>
            </div>
          </form>
        </div>

        {/* Why Choose Custom Order */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Why Choose Custom Turbo Orders?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Perfect Fit</h3>
              <p className="text-gray-600">
                Get exactly what you need for your specific vehicle and performance requirements.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👨‍🔧</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Expert Guidance</h3>
              <p className="text-gray-600">
                Our turbo specialists will guide you through the selection and installation process.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Best Value</h3>
              <p className="text-gray-600">
                Competitive pricing and flexible payment options for custom solutions.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      </div>
    </ClientWrapper>
  );
}