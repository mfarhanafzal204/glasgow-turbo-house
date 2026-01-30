import { PaymentInfo } from '@/types';

export const PAYMENT_INFO: PaymentInfo = {
  meezanBank: {
    accountTitle: "Muhammad Afzal",
    accountNumber: "05810101185578"
  },
  jazzCash: {
    accountTitle: "Muhammad Afzal",
    mobileNumber: "03006348406"
  }
};

export const CONTACT_INFO = {
  address: 'SHOP 122-H General Bus Stand Multan, Pakistan.',
  phones: ['03006348406', '03216363588'],
  email: 'glassgoww1@gmail.com',
  hours: {
    weekdays: 'Mon - Thu: 7am - 8pm',
    weekend: 'Sat-Sun: 7am - 8pm'
  },
  whatsapp: '+923006348406',
  facebook: 'https://www.facebook.com/glassgowturbo'
};

export const COMPANY_INFO = {
  name: 'Glasgow Turbo House',
  tagline: "Pakistan's First Professional Turbo Ecommerce Store",
  logo: '/logo.jpg'
};

// Enhanced SEO Keywords for #1 Google rankings
export const SEO_KEYWORDS = [
  // Primary brand keywords
  "GDS", "Glasgow Turbo House", "Glasgow Diesel Service", 
  "Muhammad Afzal turbo", "glasgowturbo.com",
  
  // Location-based keywords
  "top turbo sellers in Multan", "Multan top turbo dealers", "best turbo shop Multan",
  "turbo dealers Multan Pakistan", "Multan diesel turbo repair", "turbo services Multan",
  
  // Product keywords
  "turbo store", "Pakistan turbo ecommerce", "turbo parts Pakistan", "turbo store online",
  "diesel turbo parts", "turbocharger Pakistan", "turbo replacement Pakistan",
  "genuine turbo parts", "OEM turbo parts Pakistan", "aftermarket turbo parts",
  
  // Service keywords
  "professional turbo services", "turbo installation Multan", "diesel engine parts",
  "turbo repair services", "turbo maintenance Pakistan", "diesel turbo specialists",
  
  // Vehicle-specific keywords
  "Toyota turbo parts", "Honda turbo parts", "Suzuki turbo parts", "Mitsubishi turbo parts",
  "diesel car turbo", "truck turbo parts", "commercial vehicle turbo",
  
  // Industry keywords
  "turbo ecommerce Pakistan", "online turbo store Pakistan", "turbo parts online shopping",
  "diesel parts Pakistan", "automotive turbo parts", "turbo wholesale Pakistan"
];

export const SITE_CONFIG = {
  name: "GDS - Glasgow Turbo House | Top Turbo Dealers Multan Pakistan",
  description: "GDS (Glasgow Diesel Service) by Muhammad Afzal - Pakistan's #1 turbo ecommerce store. Top turbo sellers in Multan offering genuine turbo parts, professional diesel services & expert turbo installation across Pakistan. Shop online for quality turbochargers, diesel engine parts & turbo repair services.",
  url: "https://glassgow-turbo-house.vercel.app",
  keywords: SEO_KEYWORDS.join(", "),
  author: "Muhammad Afzal",
  business: "Glasgow Turbo House (GDS)",
  location: "Multan, Pakistan",
  
  // Enhanced SEO metadata
  tagline: "Pakistan's #1 Turbo Ecommerce Store - Top Turbo Dealers in Multan",
  shortDescription: "Top turbo sellers in Multan Pakistan. GDS offers genuine turbo parts, diesel services & professional turbo installation. Shop online for quality turbochargers.",
  longDescription: "Glasgow Turbo House (GDS) by Muhammad Afzal is Pakistan's leading turbo ecommerce store and top turbo dealers in Multan. We specialize in genuine turbo parts, professional diesel services, turbo installation, and turbo repair services. Our online turbo store offers quality turbochargers for Toyota, Honda, Suzuki, Mitsubishi and all major vehicle brands across Pakistan.",
  
  // Business details for local SEO
  phone: "+923006348406",
  email: "glassgoww1@gmail.com",
  address: "SHOP 122-H General Bus Stand Multan, Pakistan",
  city: "Multan",
  state: "Punjab", 
  country: "Pakistan",
  postalCode: "60000",
  
  // Social media
  facebook: "https://www.facebook.com/glassgowturbo",
  whatsapp: "+923006348406"
};