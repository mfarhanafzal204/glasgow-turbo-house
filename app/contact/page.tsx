import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import ClientWrapper from '@/components/ClientWrapper';
import ContactForm from '@/components/ContactForm';
import { Phone, Mail, MapPin, Clock, MessageSquare } from 'lucide-react';
import { CONTACT_INFO } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Contact GDS - Glasgow Turbo House | Muhammad Afzal | Top Turbo Dealers Multan',
  description: 'Contact GDS (Glasgow Diesel Service) by Muhammad Afzal - Pakistan\'s top turbo dealers in Multan. Get professional turbo parts, diesel services, and expert consultation across Pakistan.',
  keywords: 'contact GDS, Glasgow Turbo House contact, Muhammad Afzal turbo contact, top turbo dealers Multan contact, Glasgow Diesel Service, turbo services Pakistan',
};

export default function ContactPage() {
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
                    {CONTACT_INFO.phones.map((phone) => (
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

            {/* Quick Actions - Below Business Hours */}
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
                  href={`tel:${CONTACT_INFO.phones[0]}`}
                  className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                >
                  <Phone className="h-5 w-5 text-primary-600" />
                  <span className="font-medium text-gray-900">Call Now</span>
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <ContactForm />
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
      </div>
    </ClientWrapper>
  );
}