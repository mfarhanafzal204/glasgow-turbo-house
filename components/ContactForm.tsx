'use client';

import { useState } from 'react';
import { Phone, MessageSquare } from 'lucide-react';
import { CONTACT_INFO } from '@/lib/constants';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast, { Toaster } from 'react-hot-toast';

export default function ContactForm() {
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

      <Toaster position="top-right" />
    </div>
  );
}