'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import AdminDashboard from '@/components/admin/AdminDashboard';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [user, loading, error] = useAuthState(auth);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Check if Firebase is properly configured
  const isFirebaseConfigured = auth && 
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'demo-key';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFirebaseConfigured) {
      toast.error('Firebase is not configured. Please set up your environment variables.');
      return;
    }

    setIsLoggingIn(true);

    try {
      await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
      toast.success('Welcome to admin panel!');
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found') {
        toast.error('No admin user found. Please create an admin user in Firebase.');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Invalid password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address.');
      } else {
        toast.error('Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user && isFirebaseConfigured) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-6 px-3 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-base sm:text-lg">GT</span>
          </div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Glasgow Turbo House - Admin Panel
          </p>
        </div>

        {!isFirebaseConfigured ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-semibold text-yellow-800 mb-3 sm:mb-4">
                Firebase Configuration Required
              </h3>
              <div className="text-sm text-yellow-700 space-y-2 text-left">
                <p><strong>To enable admin login, you need to:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2 sm:ml-4 text-xs sm:text-sm">
                  <li>Create a Firebase project</li>
                  <li>Enable Authentication</li>
                  <li>Update your .env.local file</li>
                  <li>Create an admin user</li>
                </ol>
                <p className="mt-3 sm:mt-4 text-xs sm:text-sm">
                  <strong>Follow the setup guide:</strong> FINAL_SETUP_INSTRUCTIONS.md
                </p>
              </div>
              <div className="mt-4 sm:mt-6">
                <a 
                  href="https://console.firebase.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary w-full sm:w-auto inline-block text-center"
                >
                  Go to Firebase Console
                </a>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  className="input-field w-full"
                  placeholder="admin@glasgowturbo.com"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  className="input-field w-full"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoggingIn ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Secure admin access only. Unauthorized access is prohibited.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}