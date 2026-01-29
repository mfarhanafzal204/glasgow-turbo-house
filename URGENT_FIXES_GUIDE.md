# 🚨 URGENT FIXES - STEP BY STEP GUIDE

## 🔥 **ISSUE 1: Permission Denied Error**

### **Root Cause:** 
Your Firestore security rules are blocking writes from the contact form and order submission.

### **IMMEDIATE FIX:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `glasgow-turbo-store-b0c90`
3. Click **Firestore Database** → **Rules** tab
4. Replace existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
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
    
    // Allow public read access to products
    match /products/{document} {
      allow read: if true;
      allow write: if request.auth != null;
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
    
    // Test collection
    match /test/{document} {
      allow read, write: if true;
    }
  }
}
```

5. Click **Publish**
6. Wait 1-2 minutes for rules to propagate

### **Result:** ✅ Contact form and orders will work immediately

---

## 🖼️ **ISSUE 2: Logo Not Showing**

### **Root Cause:** 
Next.js serves static files from `/public` directory, but your logo is in `/assets`

### **IMMEDIATE FIX:**
Copy your logo file to the correct location:

1. Copy `/assets/logo.jpg` to `/public/logo.jpg`
2. Or update the image paths in the code (already done in latest update)

### **Alternative Solution:**
The code now tries multiple paths automatically:
- `/assets/logo.jpg` (first try)
- `/logo.jpg` (second try)  
- `/assets/logo.png` (third try)
- Shows "GT" fallback if all fail

### **Result:** ✅ Logo will display or show professional "GT" fallback

---

## 📦 **ISSUE 3: Orders Not Showing in Admin**

### **Root Cause:** 
Same as Issue 1 - Firestore rules blocking writes

### **IMMEDIATE FIX:**
1. Apply the Firestore rules above
2. Test by submitting a new order
3. Check Admin Panel → Orders tab

### **Enhanced Order Structure:**
Orders now include:
- ✅ Complete customer information
- ✅ Product details with images
- ✅ Payment method and proof status
- ✅ Order date and timestamps
- ✅ Compatible vehicles info

### **Result:** ✅ All new orders will appear in Admin Panel

---

## 🔧 **VERIFICATION STEPS:**

### **1. Test Contact Form:**
- Go to `/contact` page
- Fill out and submit form
- Should show: "Message sent successfully!"
- Check Admin Panel → Messages tab

### **2. Test Order Submission:**
- Add product to cart
- Go to checkout
- Fill out order form
- Submit order
- Should show: "Order submitted successfully!"
- Check Admin Panel → Orders tab

### **3. Test Logo Display:**
- Refresh homepage
- Logo should appear in header and footer
- If not, check browser console for errors

---

## ⚡ **QUICK TEMPORARY FIX (If Above Doesn't Work):**

If you need immediate testing, use these temporary rules:

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

⚠️ **WARNING:** These rules allow anyone to read/write everything. Use only for testing, then replace with production rules above.

---

## 📞 **SUPPORT:**

If issues persist:
1. Check browser console for errors
2. Check Firebase Console → Firestore → Usage tab
3. Verify your Firebase project ID is: `glasgow-turbo-store-b0c90`
4. Contact support with specific error messages

---

## ✅ **EXPECTED RESULTS AFTER FIXES:**

1. ✅ Contact form submits successfully
2. ✅ Orders appear in Admin Panel immediately  
3. ✅ Logo displays in header and footer
4. ✅ No permission denied errors
5. ✅ Professional error messages for users
6. ✅ Complete order tracking in admin

**Apply the Firestore rules first - this will fix 90% of your issues immediately!** 🚀