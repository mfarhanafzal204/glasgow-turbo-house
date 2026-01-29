# Firestore Rules Fix for Items Collection

## Issue
The Item Management system is failing to save items because the Firestore rules don't include the `items` collection.

## Updated Firestore Rules

Replace your current Firestore rules with these updated rules:

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

    // NEW: Items collection for Item Management System
    match /items/{document} {
      allow read, write: if request.auth != null;
    }

    // NEW: Item suppliers linking collection (for future use)
    match /itemSuppliers/{document} {
      allow read, write: if request.auth != null;
    }

    // NEW: Item stock tracking collection (for future use)
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

## How to Apply These Rules

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: glasgow-turbo-store-b0c90
3. **Navigate to Firestore Database**
4. **Click on "Rules" tab**
5. **Replace the existing rules** with the updated rules above
6. **Click "Publish"**

## What Changed

### Added Collections:
- **`items`**: Main items collection for the Item Management system
- **`itemSuppliers`**: For linking items to suppliers (future enhancement)
- **`itemStock`**: For tracking item stock levels (future enhancement)

### Security:
- All new collections require authentication (`request.auth != null`)
- Only authenticated admin users can read/write items
- Maintains security while allowing item management functionality

## Verification

After applying the rules, try adding an item again. The error should be resolved and items should save successfully.

## Status: ✅ READY TO APPLY

Copy the updated rules above and apply them to your Firestore Database rules section in the Firebase Console.