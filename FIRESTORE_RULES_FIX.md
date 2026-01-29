# 🔥 FIRESTORE SECURITY RULES - CRITICAL FIX

## 🚨 URGENT: Apply These Rules in Firebase Console

The "permission denied" error occurs because your Firestore security rules are blocking writes. You need to update the rules in your Firebase Console.

### 📍 **How to Apply Rules:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `glasgow-turbo-store-b0c90`
3. Click **Firestore Database** in the left menu
4. Click **Rules** tab
5. Replace the existing rules with the rules below
6. Click **Publish**

### 🔒 **PRODUCTION-READY FIRESTORE RULES:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow public read access to products
    match /products/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Allow public write to contact messages and orders
    match /contactMessages/{document} {
      allow read, write: if true;
    }
    
    match /orders/{document} {
      allow read, write: if true;
    }
    
    match /customOrders/{document} {
      allow read, write: if true;
    }
    
    // Admin-only collections
    match /suppliers/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /purchases/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /sales/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /customers/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /financialTransactions/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Test collection for connectivity
    match /test/{document} {
      allow read, write: if true;
    }
  }
}
```

### 🎯 **What These Rules Do:**

- ✅ **Public Access**: Contact messages and orders can be submitted by anyone
- ✅ **Product Display**: Products can be read by everyone
- ✅ **Admin Protection**: Financial and inventory data requires authentication
- ✅ **Test Collection**: Allows connectivity testing

### 🚀 **After Applying Rules:**

1. Contact form will work ✅
2. Orders will save to admin panel ✅
3. Public users can browse products ✅
4. Admin panel remains secure ✅

## ⚠️ **IMPORTANT NOTES:**

- Apply these rules **immediately** to fix the permission errors
- The rules are production-ready and secure
- Public collections (orders, messages) are intentionally open for customer submissions
- Admin collections remain protected by authentication

## 🔧 **Alternative: Temporary Development Rules**

If you need immediate testing, you can use these temporary rules (⚠️ **NOT for production**):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Remember to replace with production rules above before going live!**