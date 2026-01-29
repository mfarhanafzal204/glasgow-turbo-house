# 🔧 FIREBASE TROUBLESHOOTING - FIX "Failed to load products"

## 🚨 **CURRENT ISSUE**
You're seeing: "Failed to load products. Please configure Firebase."

## ✅ **WHAT'S WORKING**
- ✅ Firebase config is correct
- ✅ Environment variables are set
- ✅ App is running on http://localhost:3001
- ✅ Admin panel can add products

## ❌ **WHAT'S MISSING**
The issue is that **Firestore Database is not enabled** in your Firebase Console.

---

## 🚀 **SOLUTION (5 MINUTES)**

### STEP 1: Enable Firestore Database
1. Go to **https://console.firebase.google.com**
2. Click your project: **"glasgow-turbo-store-b0c90"**
3. Click **"Firestore Database"** in left sidebar
4. Click **"Create database"**
5. Choose **"Start in test mode"**
6. Click **"Next"**
7. Location: Choose **"asia-south1 (Mumbai)"**
8. Click **"Done"**

### STEP 2: Set Security Rules
1. Go to **"Rules"** tab in Firestore
2. Replace with this code:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /orders/{document} {
      allow create: if true;
      allow read, update: if request.auth != null;
    }
    match /customOrders/{document} {
      allow create: if true;
      allow read, update: if request.auth != null;
    }
  }
}
```

3. Click **"Publish"**

### STEP 3: Test Your Store
1. Go to **http://localhost:3001**
2. Products should now appear!

---

## 🎯 **QUICK VERIFICATION**

After completing the steps above:
- Homepage should show your products
- No more "Failed to load products" error
- Store will be fully functional

**This will take 5 minutes and your store will work perfectly!**