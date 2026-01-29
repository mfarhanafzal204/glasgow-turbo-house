import { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Award, Users, Wrench, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About GDS - Glasgow Turbo House | Muhammad Afzal | Top Turbo Dealers Multan',
  description: 'Learn about GDS (Glasgow Diesel Service) by Muhammad Afzal - Pakistan\'s #1 turbo ecommerce store. Top turbo sellers in Multan offering professional turbo parts and diesel services across Pakistan.',
  keywords: 'GDS, Glasgow Turbo House, Muhammad Afzal turbo, top turbo dealers Multan, Glasgow Diesel Service, Pakistan turbo ecommerce, turbo sellers Multan',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            About GDS - Glasgow Turbo House
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Pakistan's #1 turbo ecommerce store. Top turbo dealers in Multan 
            providing professional turbo parts, diesel services, and expert turbo installation across Pakistan.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story - Company Vision</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                Founded with a vision to revolutionize Pakistan's turbo industry, 
                Glasgow Turbo House (GDS) has become the country's leading turbo ecommerce platform, 
                serving customers with premium quality turbochargers and diesel engine solutions.
              </p>
              <p>
                Based in Multan, we understand the unique needs of Pakistani vehicle owners 
                and provide tailored turbo solutions for cars, trucks, and commercial vehicles. 
                GDS is now recognized as the top turbo sellers in Multan.
              </p>
              <p>
                Our commitment to quality, competitive pricing, and exceptional customer 
                service has made Glasgow Diesel Service (GDS) the trusted choice for 
                professional turbo solutions across Pakistan.
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Choose Us?</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Award className="h-6 w-6 text-primary-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Quality Assured</h4>
                  <p className="text-gray-600 text-sm">Only genuine, high-quality turbo parts</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Users className="h-6 w-6 text-primary-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Expert Team</h4>
                  <p className="text-gray-600 text-sm">Experienced professionals at your service</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Wrench className="h-6 w-6 text-primary-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Complete Solutions</h4>
                  <p className="text-gray-600 text-sm">From parts to installation and repair</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-6 w-6 text-primary-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Pakistan-wide Service</h4>
                  <p className="text-gray-600 text-sm">Serving customers across the country</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔧</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Turbo Repair</h3>
              <p className="text-gray-600 text-sm">
                Professional turbocharger repair and reconditioning services
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛒</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Parts Supply</h3>
              <p className="text-gray-600 text-sm">
                Wide range of genuine turbo parts and accessories
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚙️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Installation</h3>
              <p className="text-gray-600 text-sm">
                Expert installation and setup services
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚛</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Diesel Services</h3>
              <p className="text-gray-600 text-sm">
                Complete diesel engine solutions and maintenance
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Consultation</h3>
              <p className="text-gray-600 text-sm">
                Expert advice and technical consultation
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Custom Solutions</h3>
              <p className="text-gray-600 text-sm">
                Tailored turbo solutions for specific needs
              </p>
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-primary-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-700">
              To provide Pakistan's automotive industry with the highest quality turbo 
              parts and services, making advanced turbo technology accessible and 
              affordable for every vehicle owner.
            </p>
          </div>
          
          <div className="bg-gray-100 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
            <p className="text-gray-700">
              To become Pakistan's leading turbo solutions provider, known for 
              innovation, reliability, and exceptional customer satisfaction 
              across all automotive segments.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}