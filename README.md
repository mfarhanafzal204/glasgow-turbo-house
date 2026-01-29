# Glasgow Turbo House - Ecommerce Store

Pakistan's first professional turbo ecommerce store with dynamic admin panel and modern UI.

## 🚀 Features

### Frontend Store
- **Modern Amazon-style UI** with responsive design
- **Product catalog** with dynamic loading from Firebase
- **Shopping cart** with local storage persistence
- **Custom turbo order** system for special requests
- **Payment integration** with Meezan Bank & JazzCash
- **SEO optimized** with Next.js SSR, meta tags, and structured data

### Admin Panel
- **Secure authentication** with Firebase Auth
- **Product management** - Add, edit, delete products
- **Image uploads** to Firebase Storage
- **Order management** with status tracking
- **Custom order handling** and workflow
- **Real-time dashboard** with analytics

### Technical Features
- **Next.js 14** with App Router for SSR/SEO
- **Firebase** backend (Auth, Firestore, Storage)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Responsive design** mobile-first approach
- **Image optimization** with WebP support
- **Performance optimized** with lazy loading

## 🛠️ Setup Instructions

### 1. Clone Repository
```bash
git clone <repository-url>
cd glasgow-turbo-ecommerce
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Setup
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication, Firestore, and Storage
3. Copy your Firebase config from Project Settings
4. Create `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Firebase Security Rules

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products - read for all, write for authenticated users only
    match /products/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Orders - write for all, read for authenticated users only
    match /orders/{document} {
      allow create: if true;
      allow read, update: if request.auth != null;
    }
    
    // Custom orders - write for all, read for authenticated users only
    match /customOrders/{document} {
      allow create: if true;
      allow read, update: if request.auth != null;
    }
  }
}
```

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /orders/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if true;
    }
  }
}
```

### 5. Create Admin User
1. Go to Firebase Authentication
2. Add a new user with email/password
3. Use these credentials to access `/admin`

### 6. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the store.

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── admin/             # Admin panel pages
│   ├── cart/              # Shopping cart page
│   ├── custom-order/      # Custom order page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   ├── robots.ts          # SEO robots.txt
│   └── sitemap.ts         # SEO sitemap
├── components/            # React components
│   ├── admin/            # Admin panel components
│   ├── Footer.tsx        # Site footer
│   ├── Header.tsx        # Site header
│   ├── LoadingSpinner.tsx
│   └── ProductCard.tsx   # Product display card
├── hooks/                # Custom React hooks
│   └── useCart.ts        # Shopping cart logic
├── lib/                  # Utility libraries
│   ├── constants.ts      # App constants
│   ├── firebase.ts       # Firebase configuration
│   └── utils.ts          # Helper functions
├── types/                # TypeScript type definitions
│   └── index.ts          # Main types
└── public/               # Static assets
```

## 🎯 SEO Features

- **Server-Side Rendering** with Next.js
- **Meta tags** for all pages
- **Open Graph** and Twitter Card support
- **Structured data** (JSON-LD) for products
- **Sitemap.xml** auto-generation
- **Robots.txt** configuration
- **Image optimization** with alt text
- **Semantic HTML** structure

## 💳 Payment Integration

The store uses hardcoded payment information for:
- **Meezan Bank** transfers
- **JazzCash** mobile payments

Customers submit payment proof images which are stored in Firebase Storage.

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Netlify
1. Build the project: `npm run build`
2. Deploy the `out` folder to Netlify
3. Add environment variables in Netlify dashboard

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## 🔧 Customization

### Branding
- Update `SITE_CONFIG` in `lib/constants.ts`
- Replace logo and favicon in `public/`
- Modify colors in `tailwind.config.js`

### Payment Methods
- Update `PAYMENT_INFO` in `lib/constants.ts`
- Modify payment forms in cart page

### SEO Keywords
- Update `SEO_KEYWORDS` in `lib/constants.ts`
- Modify meta descriptions in page components

## 📱 Mobile Optimization

- **Mobile-first** responsive design
- **Touch-friendly** interface
- **Fast loading** with image optimization
- **PWA ready** with manifest.json

## 🔒 Security

- **Firebase Authentication** for admin access
- **Firestore security rules** for data protection
- **Input validation** on all forms
- **XSS protection** with proper sanitization

## 📊 Analytics Ready

The store is ready for:
- Google Analytics 4
- Facebook Pixel
- Google Tag Manager

Add tracking codes in `app/layout.tsx`.

## 🆘 Support

For technical support or customization requests:
- Email: support@glasgowturbo.com
- Phone: +92 300 1234567

## 📄 License

This project is proprietary software for Glasgow Turbo House.

---

**Glasgow Turbo House** - Pakistan's First Professional Turbo Ecommerce Store