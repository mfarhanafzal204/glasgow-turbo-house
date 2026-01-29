'use client';

import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Facebook } from 'lucide-react';
import { CONTACT_INFO, COMPANY_INFO } from '@/lib/constants';

export default function Footer() {
  const handleCallNow = () => {
    window.location.href = `tel:${CONTACT_INFO.phones[0]}`;
  };

  const handleFacebookClick = () => {
    window.open(CONTACT_INFO.facebook, '_blank');
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6 logo-container">
              <div className="relative w-12 h-12 flex-shrink-0">
                <img
                  src="/logo.jpg"
                  alt="Glasgow Turbo House Logo"
                  className="w-full h-full object-contain rounded-lg"
                  style={{ display: 'block' }}
                  onError={(e) => {
                    console.error('Footer logo failed to load, showing fallback');
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                    const fallback = img.nextElementSibling as HTMLElement;
                    if (fallback) {
                      fallback.style.display = 'flex';
                    }
                  }}
                  onLoad={() => {
                    console.log('Footer logo loaded successfully from /logo.jpg');
                  }}
                />
                {/* Professional Fallback GT logo */}
                <div className="absolute inset-0 items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold text-sm rounded-lg shadow-lg" style={{ display: 'none' }}>
                  <span className="text-shadow">GT</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold">{COMPANY_INFO.name}</h3>
                <p className="text-blue-400 text-sm font-medium">Professional Turbo Solutions</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 leading-relaxed">
              {COMPANY_INFO.tagline}. We provide high-quality turbo parts, 
              professional installation, and expert diesel services in Multan, Pakistan.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleFacebookClick}
                className="bg-blue-600 hover:bg-blue-700 p-3 rounded-full transition-colors"
                aria-label="Visit our Facebook page"
              >
                <Facebook className="h-5 w-5" />
              </button>
              <button
                onClick={handleCallNow}
                className="bg-blue-600 hover:bg-blue-700 p-3 rounded-full transition-colors"
                aria-label="Call us now"
              >
                <Phone className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Contact Info</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300 text-sm leading-relaxed">
                  {CONTACT_INFO.address}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <div className="text-gray-300 text-sm">
                  {CONTACT_INFO.phones.map((phone, index) => (
                    <div key={phone}>
                      <a 
                        href={`tel:${phone}`}
                        className="hover:text-blue-400 transition-colors"
                      >
                        {phone}
                      </a>
                      {index < CONTACT_INFO.phones.length - 1 && <span className="mx-2">•</span>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <a 
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="text-gray-300 text-sm hover:text-blue-400 transition-colors"
                >
                  {CONTACT_INFO.email}
                </a>
              </div>
            </div>
          </div>

          {/* Opening Hours */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Opening Hours</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-gray-300 text-sm">
                  <p className="font-medium">{CONTACT_INFO.hours.weekdays}</p>
                  <p className="font-medium">{CONTACT_INFO.hours.weekend}</p>
                  <p className="text-xs text-gray-400 mt-2">Friday: Closed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <h5 className="font-semibold mb-4">Shop</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="text-gray-300 hover:text-blue-400 transition-colors">Home</Link></li>
                <li><Link href="/search" className="text-gray-300 hover:text-blue-400 transition-colors">All Products</Link></li>
                <li><Link href="/cart" className="text-gray-300 hover:text-blue-400 transition-colors">Shopping Cart</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Services</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="/custom-order" className="text-gray-300 hover:text-blue-400 transition-colors">Custom Order</Link></li>
                <li><span className="text-gray-300">Turbo Installation</span></li>
                <li><span className="text-gray-300">Diesel Services</span></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Company</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-gray-300 hover:text-blue-400 transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-blue-400 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={handleCallNow}
                    className="text-gray-300 hover:text-blue-400 transition-colors text-left"
                  >
                    Call Support
                  </button>
                </li>
                <li>
                  <a 
                    href={`https://wa.me/${CONTACT_INFO.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-blue-400 transition-colors"
                  >
                    WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © 1960 {COMPANY_INFO.name}. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm">
            <span className="text-gray-400">Made by Muhammad Farhan Afzal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}