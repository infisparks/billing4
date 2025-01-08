'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../firebase/firebaseConfig';
import Default from 'components/auth/variants/DefaultAuthLayout';
import InputField from 'components/fields/InputField';

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect to dashboard or desired page
      window.location.href = '/';
    } catch (error: any) {
      console.error('Error signing in:', error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Default
      maincard={
        <div className="flex flex-col items-center justify-center w-full px-4 py-8 md:px-0 lg:py-10 dark:bg-gray-900">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
            <h2 className="mb-6 text-3xl font-extrabold text-gray-900 dark:text-white text-center">
              Sign In
            </h2>
            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Email */}
              <InputField
                variant="auth"
                label="Email*"
                placeholder="Enter your email"
                id="email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
              />

              {/* Password */}
              <InputField
                variant="auth"
                label="Password*"
                placeholder="Enter your password"
                id="password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-500 hover:bg-brand-600 active:bg-brand-700'} 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition`}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
            <div className="mt-6 text-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?
              </span>
              <a
                href="/auth/sign-up"
                className="ml-2 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-white"
              >
                Sign Up
              </a>
            </div>
          </div>
        </div>
      }
    />
  );
}

export default SignIn;
