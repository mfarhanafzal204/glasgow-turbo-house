# Complete Firestore Rules Fix

## Updated Firestore Security Rules

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
    
    // NEW: Items collection for item management
    match /items/{document} {
      allow read, write: if request.auth != null;
    }
    
    // NEW: Item stock tracking collection
    match /itemStock/{document} {
      allow read, write: if request.auth != null;
    }

    // Test collection for connectivity
    match /test/{document} {
      allow read, write: if true;
    }
  }
}
```

## What's Fixed

1. **Added `items` collection** - For the master item catalog
2. **Added `itemStock` collection** - For stock tracking data
3. **Maintained existing permissions** - All other collections work as before

## How to Apply

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Click on "Rules" tab
4. Replace the existing rules with the rules above
5. Click "Publish"

The system will now support:
- ✅ Item Management (adding/editing items)
- ✅ Stock Tracking (purchase/sale stock updates)
- ✅ All existing functionality (orders, contacts, etc.)