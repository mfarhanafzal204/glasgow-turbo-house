import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    
    // Test reading from a collection
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    console.log('Firebase read test successful. Documents found:', snapshot.size);
    
    // Test writing to a collection
    const testDoc = await addDoc(collection(db, 'test'), {
      message: 'Test connection',
      timestamp: new Date()
    });
    console.log('Firebase write test successful. Document ID:', testDoc.id);
    
    return { success: true, message: 'Firebase connection working' };
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return { success: false, error };
  }
};

export const testSupplierCollection = async () => {
  try {
    console.log('Testing suppliers collection...');
    
    // Test reading suppliers
    const suppliersCollection = collection(db, 'suppliers');
    const snapshot = await getDocs(suppliersCollection);
    console.log('Suppliers collection read successful. Documents found:', snapshot.size);
    
    return { success: true, count: snapshot.size };
  } catch (error) {
    console.error('Suppliers collection test failed:', error);
    return { success: false, error };
  }
};