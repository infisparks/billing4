// src/app/admin/productDashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { database } from '../../../../firebase/firebaseConfig';
import { ref, onValue } from 'firebase/database';

import {
  FaSearch,
  FaBox,
  FaWarehouse,
  FaExclamationCircle,
  FaFilter,
} from 'react-icons/fa';
// Removed FaDollarSign and FaList as they're no longer needed
import { format } from 'date-fns';

/*
  Interface for the product data in Firebase:
  {
    "products": {
      "<productId>": {
        "name": string,
        "price": number,
        "quantity": number,
        "averageQuantity": number,
        ...
      },
      ...
    }
  }
*/
interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  averageQuantity: number; // For the new column in Inventory tab
  // ... any other fields you might have
}

type TabType = 'inventory'; // Only 'inventory' tab is needed

function ProductDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state
  const [selectedTab, setSelectedTab] = useState<TabType>('inventory');

  // Fetch products from Firebase
  useEffect(() => {
    const productsRef = ref(database, 'products');

    const unsubscribe = onValue(
      productsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Map over keys to build product array
          const productList: Product[] = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setProducts(productList);
          setFilteredProducts(productList);
        } else {
          setProducts([]);
          setFilteredProducts([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching products:', error);
        setError('Failed to fetch products.');
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Search logic
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const lowercasedTerm = searchTerm.toLowerCase();
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(lowercasedTerm)
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Handling tab switching (only 'inventory' remains)
  const handleTabChange = (tab: TabType) => {
    setSelectedTab(tab);
  };

  // Loading and error states
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <svg
            className="animate-spin h-10 w-10 text-brand-500 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-500 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  // Calculate total items (for Inventory tab)
  const totalItems = filteredProducts.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 text-center">
          Product Dashboard
        </h2>

        {/* Tabs */}
        <div className="mb-6 flex space-x-4 justify-center">
          <button
            onClick={() => handleTabChange('inventory')}
            className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500
              ${
                selectedTab === 'inventory'
                  ? 'bg-brand-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <FaFilter className="inline-block mr-2" />
            Inventory
          </button>
          {/* Removed Purchase List tab button */}
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex justify-center">
          <div className="relative w-full max-w-md">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Conditional Rendering of Tabs */}
        {selectedTab === 'inventory' && (
          <InventoryTab products={filteredProducts} />
        )}

        {/* Removed PurchaseListTab rendering */}
      </div>
    </div>
  );
}

/* ------------------------------------------
   Inventory Tab
------------------------------------------ */
interface InventoryTabProps {
  products: Product[];
}

function InventoryTab({ products }: InventoryTabProps) {
  if (products.length === 0) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-400">
        No products found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <thead>
          <tr>
            <th className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <div className="flex items-center">
                <FaBox className="mr-2" />
                Product Name
              </div>
            </th>
            {/* Removed FaDollarSign and updated Price column */}
            <th className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Price (₹)
            </th>
            <th className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Average Quantity
            </th>
            <th className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <div className="flex items-center">
                <FaWarehouse className="mr-2" />
                Quantity
              </div>
            </th>
            <th className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <div className="flex items-center">
                <FaExclamationCircle className="mr-2" />
                Status
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {product.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                ₹{product.price.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                {product.averageQuantity}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                {product.quantity}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {product.quantity <= 5 ? (
                  <span className="text-red-500 font-semibold">Low Stock</span>
                ) : (
                  <span className="text-green-500 font-semibold">In Stock</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Removed PurchaseListTab component as it's no longer needed

export default ProductDashboard;
