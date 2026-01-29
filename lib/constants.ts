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

// SEO Keywords for top Google rankings
export const SEO_KEYWORDS = [
  "GDS", "Glasgow Turbo House", "Glasgow Diesel Service", 
  "top turbo sellers in Multan", "turbo store", "Pakistan turbo ecommerce",
  "Multan top turbo dealers", "Muhammad Afzal turbo", "turbo parts Pakistan",
  "diesel turbo repair Multan", "turbo replacement Pakistan", "best turbo shop Multan",
  "professional turbo services", "turbo installation Multan", "diesel engine parts"
];

export const SITE_CONFIG = {
  name: "Glasgow Turbo House - GDS",
  description: "GDS (Glasgow Diesel Service) - Pakistan's #1 turbo ecommerce store by Muhammad Afzal. Top turbo sellers in Multan offering professional turbo parts, diesel services & turbo installation across Pakistan.",
  url: "https://glasgowturbo.com",
  keywords: SEO_KEYWORDS.join(", "),
  author: "Muhammad Afzal",
  business: "Glasgow Turbo House (GDS)",
  location: "Multan, Pakistan"
};