# 🚀 Complete Setup Guide - Glasgow Turbo Ecommerce Store

## Step-by-Step Instructions to Make Your Store Fully Functional

### 📋 Prerequisites
- ✅ Node.js v18+ (You have v24.11.0 - Perfect!)
- ✅ npm (You have v11.6.1 - Perfect!)
- 🔥 Firebase Account (Free)
- 💻 Code Editor (VS Code recommended)

---

## 🔥 Step 1: Firebase Setup (CRITICAL)

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `glasgow-turbo-store`
4. Disable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Firebase Services

#### Enable Authentication:
1. In Firebase Console → Authentication
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password"
5. Click "Save"

#### Enable Firestore Database:
1. In Firebase Console → Firestore Database
2. Click "Create database"
3. Choose "Start in test mode"
4. Select location (closest to Pakistan: asia-south1)
5. Click "Done"

#### Enable Storage:
1. In Firebase Console → Storage
2. Click "Get started"
3. Choose "Start in test mode"
4. Select same location as Firestore
5. Click "Done"

### 1.3 Get Firebase Configuration
1. In Firebase Console → Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (</>) 
4. Enter app nickname: "Glasgow Turbo Store"
5. Click "Register app"
6. Copy the config object

### 1.4 Update Environment Variables
1. Open `.env.local` file in your project
2. Replace the placeholder values with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=glasgow-turbo-store.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=glasgow-turbo-store
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=glasgow-turbo-store.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## 🔧 Step 2: Install Dependencies & Run

### 2.1 Install Dependencies
```bash
npm install
```

### 2.2 Start Development Server
```bash
npm run dev
```

Your store will be available at: `http://localhost:3000`

---

## 👤 Step 3: Create Admin User

### 3.1 Create Admin Account
1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. Enter email: `admin@glasgowturbo.com`
4. Enter password: `Admin123!` (or your preferred password)
5. Click "Add user"

### 3.2 Access Admin Panel
1. Go to `http://localhost:3000/admin`
2. Login with the credentials you created
3. You'll see the admin dashboard

---

## 🛡️ Step 4: Configure Firebase Security Rules

### 4.1 Firestore Rules
1. Go to Firebase Console → Firestore Database → Rules
2. Replace the rules with:

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

3. Click "Publish"

### 4.2 Storage Rules
1. Go to Firebase Console → Storage → Rules
2. Replace the rules with:

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

3. Click "Publish"

---

## 🛍️ Step 5: Test Your Store

### 5.1 Add Your First Product
1. Go to `http://localhost:3000/admin`
2. Login with admin credentials
3. Click "Products" tab
4. Click "Add Product"
5. Fill in product details:
   - Name: "GT2860RS Turbocharger"
   - Description: "High-performance turbocharger for sports cars"
   - Original Price: 150000
   - Discounted Price: 135000
   - Compatible Vehicles: "Toyota Supra, Nissan Skyline"
   - Category: "Turbocharger"
   - Upload turbo image
   - Check "In Stock"
6. Click "Add Product"

### 5.2 Test Customer Experience
1. Go to `http://localhost:3000`
2. You should see your product displayed
3. Click "Add to Cart"
4. Go to cart page
5. Test the checkout process

### 5.3 Test Custom Orders
1. Go to `http://localhost:3000/custom-order`
2. Fill out the custom order form
3. Submit the order
4. Check admin panel to see the custom order

---

## 🚀 Step 6: Deploy Your Store (FREE)

### Option A: Deploy to Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/glasgow-turbo-store.git
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard
   - Deploy!

### Option B: Deploy to Netlify

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `.next` folder
   - Add environment variables in Netlify dashboard

---

## 🎨 Step 7: Customize Your Store

### 7.1 Update Branding
1. Edit `lib/constants.ts`:
   - Update company name
   - Update contact information
   - Update payment details

2. Replace logo and favicon in `public/` folder

### 7.2 Update Colors
1. Edit `tailwind.config.js` to change color scheme
2. Update primary colors to match your brand

### 7.3 Add Your Products
1. Use admin panel to add all your turbo products
2. Upload high-quality product images
3. Write detailed descriptions

---

## 📱 Step 8: Mobile Testing

1. Open your store on mobile devices
2. Test all functionality:
   - Product browsing
   - Cart operations
   - Custom orders
   - Admin panel

---

## 🔍 Step 9: SEO Optimization

### 9.1 Update Meta Information
1. Edit `app/layout.tsx` for global SEO
2. Update `lib/constants.ts` for keywords
3. Add Google Analytics (optional)

### 9.2 Submit to Search Engines
1. Your sitemap is auto-generated at `/sitemap.xml`
2. Submit to Google Search Console
3. Submit to Bing Webmaster Tools

---

## 🛠️ Troubleshooting

### Common Issues:

**1. Firebase Connection Error:**
- Check `.env.local` file has correct values
- Ensure Firebase services are enabled
- Check Firebase security rules

**2. Build Errors:**
- Run `npm install` again
- Clear `.next` folder: `rm -rf .next`
- Restart development server

**3. Images Not Loading:**
- Check Firebase Storage rules
- Ensure images are uploaded correctly
- Check image URLs in Firestore

**4. Admin Login Issues:**
- Verify user exists in Firebase Auth
- Check email/password combination
- Ensure Authentication is enabled

---

## 📞 Support

If you need help:
1. Check the console for error messages
2. Verify all Firebase services are properly configured
3. Ensure environment variables are correct
4. Test with a fresh browser/incognito mode

---

## 🎉 Congratulations!

Your Glasgow Turbo Ecommerce Store is now fully functional with:
- ✅ Modern responsive design
- ✅ Dynamic product management
- ✅ Shopping cart functionality
- ✅ Custom order system
- ✅ Admin panel
- ✅ Payment integration
- ✅ SEO optimization
- ✅ Free deployment ready

**Your store is now ready to serve customers across Pakistan!**

---

## 📋 Quick Commands Reference

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Check for linting issues
npm run lint
```

**Store URLs:**
- Homepage: `http://localhost:3000`
- Admin Panel: `http://localhost:3000/admin`
- Custom Orders: `http://localhost:3000/custom-order`
- Cart: `http://localhost:3000/cart`