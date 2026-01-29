'use client';

import { useState } from 'react';
import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import ClientWrapper from '@/components/ClientWrapper';
import { Phone, Mail, MapPin, Clock, MessageSquare } from 'lucide-react';
import { CONTACT_INFO } from '@/lib/constants';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast, { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Contact GDS - Glasgow Turbo House | Muhammad Afzal | Top Turbo Dealers Multan',
  description: 'Contact GDS (Glasgow Diesel Service) by Muhammad Afzal - Pakistan\'s top turbo dealers in Multan. Get professional turbo parts, diesel services, and expert consultation across Pakistan.',
  keywords: 'contact GDS, Glasgow Turbo House contact, Muhammad Afzal turbo contact, top turbo dealers Multan contact, Glasgow Diesel Service, turbo services Pakistan',
};

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || 
          !formData.phone.trim() || !formData.subject.trim() || !formData.message.trim()) {
        throw new Error('Please fill in all required fields');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        throw new Error('Please enter a valid email address');
      }

      // Check if Firebase is configured
      if (!db) {
        throw new Error('Database connection not available. Please contact us directly.');
      }

      const contactMessage = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Submitting contact message:', contactMessage);
      
      const docRef = await addDoc(collection(db, 'contactMessages'), contactMessage);
      console.log('Message saved with ID:', docRef.id);
      
      toast.success('Message sent successfully! We will get back to you within 24 hours.');
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Provide specific error messages
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
        toast.error('Unable to send message. Please call us directly at ' + CONTACT_INFO.phones[0] + ' or try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallNow = () => {
    window.location.href = `tel:${CONTACT_INFO.phones[0]}`;
  };

  return (
    <ClientWrapper>
      <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Contact GDS - Glasgow Turbo House
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get in touch with our expert team at GDS for turbo parts, 
            diesel services, and professional turbo consultation. Top turbo dealers in Multan serving all Pakistan.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Get In Touch</h2>
            
            <div className="space-y-6">
              {/* Phone */}
              <div className="flex items-start space-x-4">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <Phone className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                  <div className="space-y-1">
                    {CONTACT_INFO.phones.map((phone, index) => (
                      <p key={phone} className="text-gray-600">
                        <a 
                          href={`tel:${phone}`}
                          className="hover:text-primary-600 transition-colors"
                        >
                          {phone}
                        </a>
                      </p>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Call us for immediate assistance</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start space-x-4">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <Mail className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                  <p className="text-gray-600">
                    <a 
                      href={`mailto:${CONTACT_INFO.email}`}
                      className="hover:text-primary-600 transition-colors"
                    >
                      {CONTACT_INFO.email}
                    </a>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Email us for detailed inquiries</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start space-x-4">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                  <p className="text-gray-600">{CONTACT_INFO.address}</p>
                  <p className="text-sm text-gray-500 mt-1">Visit our showroom and workshop</p>
                </div>
              </div>

              {/* Business Hours */}
              <div className="flex items-start space-x-4">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Business Hours</h3>
                  <div className="text-gray-600 space-y-1">
                    <p>{CONTACT_INFO.hours.weekdays}</p>
                    <p>{CONTACT_INFO.hours.weekend}</p>
                    <p className="text-red-600 font-medium">Friday: Closed</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Emergency services available</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a 
                  href="/custom-order" 
                  className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                >
                  <MessageSquare className="h-5 w-5 text-primary-600" />
                  <span className="font-medium text-gray-900">Custom Order</span>
                </a>
                <a 
                  onClick={handleCallNow}
                  className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 cursor-pointer"
                >
                  <Phone className="h-5 w-5 text-primary-600" />
                  <span className="font-medium text-gray-900">Call Now</span>
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="03XX XXXXXXX"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="parts">Turbo Parts</option>
                  <option value="repair">Repair Services</option>
                  <option value="custom">Custom Order</option>
                  <option value="support">Technical Support</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Please describe your inquiry in detail..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> For urgent matters, please call us directly. 
                We typically respond to messages within 24 hours during business days.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Do you provide installation services?</h3>
              <p className="text-gray-600 text-sm">
                Yes, we provide professional installation services for all turbo parts. 
                Our experienced technicians ensure proper installation and setup.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What is your warranty policy?</h3>
              <p className="text-gray-600 text-sm">
                We offer comprehensive warranty on all our products and services. 
                Warranty terms vary by product type and are clearly specified at purchase.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Do you ship nationwide?</h3>
              <p className="text-gray-600 text-sm">
                Yes, we ship across Pakistan. Shipping costs and delivery times 
                depend on your location. Free shipping available on orders above PKR 10,000.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can you help with custom turbo solutions?</h3>
              <p className="text-gray-600 text-sm">
                Absolutely! We specialize in custom turbo solutions. Use our custom order 
                form or contact us directly to discuss your specific requirements.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
      <Toaster position="top-right" />
      </div>
    </ClientWrapper>
  );
}