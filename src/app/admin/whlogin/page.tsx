// src/app/admin/login/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import axios from 'axios';
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
} from 'react-icons/fa';
import { ref, onValue } from 'firebase/database';
import { database } from '../../../../firebase/firebaseConfig';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface StatusResponse {
  authenticated: boolean;
  status: string; // e.g., 'authenticated'
}

interface QrResponseAuthenticated {
  message: string; // "Already authenticated."
}

interface QrResponseUnauthenticated {
  qr: string;
}

type QrResponse = QrResponseAuthenticated | QrResponseUnauthenticated;

// Define the structure of your token in the database
interface TokenData {
  token: string; // Ensure token is a string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://wa.medblisss.com'; // Base URL for API endpoints

function WhatsappLogin() {
  const [loading, setLoading] = useState<boolean>(true);
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [token, setToken] = useState<string>(''); // Dynamic token

  // Function to fetch token from Firebase Realtime Database
  const fetchTokenFromDB = () => {
    const tokenRef = ref(database, 'token'); // Adjust the path based on your DB structure

    onValue(
      tokenRef,
      (snapshot) => {
        const data: TokenData | null = snapshot.val();
        if (data && data.token) {
          console.log('Fetched token from DB:', data.token);
          setToken(data.token);
        } else {
          console.error('Token not found in the database.');
          setError('Token not found in the database.');
          setLoading(false);
        }
      },
      {
        onlyOnce: true, // Fetch the data once
      }
    );
  };

  // Function to fetch authentication status
  const fetchAuthStatus = async (currentToken: string) => {
    setLoading(true);
    setError('');
    try {
      console.log(`Fetching auth status for token: ${currentToken}`);
      const response = await axios.get<StatusResponse>(
        `${API_BASE_URL}/status/${encodeURIComponent(currentToken)}`
      );

      console.log('Auth status response:', response.data);

      // Handle both possible response structures
      if ('authenticated' in response.data && response.data.authenticated) {
        setAuthenticated(true);
        setQrCode('');
        toast.success('You are already authenticated!');
      } else if ('authenticated' in response.data && !response.data.authenticated) {
        // If not authenticated, fetch QR code
        await fetchQRCode(currentToken);
      } else if ('status' in response.data && response.data.status === 'authenticated') {
        setAuthenticated(true);
        setQrCode('');
        toast.success('You are already authenticated!');
      } else if ('status' in response.data && response.data.status !== 'authenticated') {
        // If not authenticated, fetch QR code
        await fetchQRCode(currentToken);
      } else {
        setError('Unexpected response from server.');
        toast.error('Unexpected response from server.');
      }
    } catch (err: any) {
      console.error('Error fetching authentication status:', err);
      setError('Failed to fetch authentication status.');
      toast.error('Failed to fetch authentication status.');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch QR code
  const fetchQRCode = async (currentToken: string) => {
    setError('');
    try {
      console.log(`Fetching QR code for token: ${currentToken}`);
      const response = await axios.get<QrResponse>(
        `${API_BASE_URL}/qr/${encodeURIComponent(currentToken)}`
      );

      console.log('QR code response:', response.data);

      if ('message' in response.data) {
        if (response.data.message === 'Already authenticated.') {
          setAuthenticated(true);
          setQrCode('');
          toast.success('You are already authenticated!');
        } else {
          setError('Unexpected message from server.');
          toast.error('Unexpected message from server.');
        }
      } else if ('qr' in response.data) {
        setQrCode(response.data.qr);
        console.log('QR Code set:', response.data.qr);
      } else {
        setError('Invalid response from server.');
        toast.error('Invalid response from server.');
      }
    } catch (err: any) {
      console.error('Error fetching QR code:', err);
      setError('Failed to fetch QR code.');
      toast.error('Failed to fetch QR code.');
    }
  };

  useEffect(() => {
    fetchTokenFromDB();
  }, []);

  useEffect(() => {
    if (token) {
      fetchAuthStatus(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Fetch auth status when token is available

  // Optional: Implement polling to check authentication status periodically
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (!authenticated && token) {
      interval = setInterval(() => {
        fetchAuthStatus(token);
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authenticated, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-6 sm:p-8 lg:p-10">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <ToastContainer />

        {loading ? (
          <div className="flex flex-col items-center">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
            <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
              Checking authentication...
            </p>
          </div>
        ) : authenticated ? (
          <div className="flex flex-col items-center">
            <FaCheckCircle className="text-green-500 text-6xl" />
            <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Successfully Logged In
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400 text-center">
              You are already authenticated with WhatsApp.
            </p>
            {/* Logout button removed */}
          </div>
        ) : qrCode ? (
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              WhatsApp Login
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
              Scan the QR code below with your WhatsApp to authenticate.
            </p>
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
              <QRCode value={qrCode} size={256} />
            </div>
            <p className="mt-6 text-gray-600 dark:text-gray-400 text-center">
              Keep your token:{' '}
              <span className="font-mono text-gray-800 dark:text-gray-200">
                {token}
              </span>
            </p>
            <button
              onClick={() => fetchAuthStatus(token)}
              className="mt-6 flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <FaSpinner className="animate-spin mr-2" />
              Refresh Status
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <FaExclamationCircle className="text-red-500 text-6xl" />
            <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Authentication Failed
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400 text-center">
              Unable to retrieve authentication QR code.
            </p>
            <button
              onClick={() => fetchAuthStatus(token)}
              className="mt-6 flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <FaSpinner className="animate-spin mr-2" />
              Retry
            </button>
            {error && (
              <div className="mt-4 flex items-center text-red-500">
                <FaExclamationCircle className="mr-2" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default WhatsappLogin;
