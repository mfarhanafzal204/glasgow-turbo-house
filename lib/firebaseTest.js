// Simple Firebase connectivity test
import { db } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    
    // Test read access
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    console.log('Read test successful, documents:', snapshot.size);
    
    // Test write access
    const testDoc = {
      message: 'Test message',
      timestamp: new Date(),
      type: 'connectivity_test'
    };
    
    const docRef = await addDoc(testCollection, testDoc);
    console.log('Write test successful, document ID:', docRef.id);
    
    return { success: true, message: 'Firebase connection working' };
  } catch (error) {
    console.error('Firebase test failed:', error);
    return { success: false, error: error.message, code: error.code };
  }
};