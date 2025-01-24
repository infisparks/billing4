// pages/AddProduct.tsx
'use client';
import { useState } from 'react';
import InputField from 'components/fields/InputField';
// Removed Checkbox as it's no longer needed
import { database } from '../../../../firebase/firebaseConfig';
import { ref, push } from 'firebase/database';
import { FaBox, FaDollarSign, FaSortNumericDown, FaChartLine } from 'react-icons/fa';

function AddProduct() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [averageQuantity, setAverageQuantity] = useState(''); // New state for average quantity
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    if (!name || !price || !quantity || !averageQuantity) {
      alert('Please fill in all required fields.');
      return;
    }

    // Additional Validation
    if (isNaN(Number(price)) || Number(price) <= 0) {
      alert('Please enter a valid price.');
      return;
    }

    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 0) {
      alert('Please enter a valid quantity (non-negative integer).');
      return;
    }

    if (!Number.isInteger(Number(averageQuantity)) || Number(averageQuantity) < 0) {
      alert('Please enter a valid average quantity (non-negative integer).');
      return;
    }

    const productData = {
      name,
      price: parseFloat(price),
      quantity: parseInt(quantity, 10),
      averageQuantity: parseInt(averageQuantity, 10), // Include average quantity in data
      createdAt: new Date().toISOString(),
    };

    try {
      setIsSubmitting(true);
      const productsRef = ref(database, 'products');
      await push(productsRef, productData);
      alert('Product added successfully!');
      // Reset Form
      setName('');
      setPrice('');
      setQuantity('');
      setAverageQuantity(''); // Reset average quantity
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 mt-5 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h2 className="mb-6 text-3xl font-extrabold text-gray-900 dark:text-white text-center">
          Add New Product
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div className="relative">
            <FaBox className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <InputField
              variant="auth"
              extra="mb-3 pl-10"
              label="Product Name*"
              placeholder="Enter product name"
              id="productName"
              type="text"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              required
            />
          </div>

          {/* Price */}
          <div className="relative">
            <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <InputField
              variant="auth"
              extra="mb-3 pl-10"
              label="Price (₹)*"
              placeholder="Enter price in ₹"
              id="price"
              type="number"
              value={price}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrice(e.target.value)}
              required
              min="0"
              step="0.01"
            />
          </div>

          {/* Quantity */}
          <div className="relative">
            <FaSortNumericDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <InputField
              variant="auth"
              extra="mb-3 pl-10"
              label="Total Quantity*"
              placeholder="Enter total quantity"
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)}
              required
              min="0"
              step="1"
            />
          </div>

          {/* Average Quantity */}
          <div className="relative">
            <FaChartLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <InputField
              variant="auth"
              extra="mb-3 pl-10"
              label="Average Quantity in Store*"
              placeholder="Enter average quantity to maintain"
              id="averageQuantity"
              type="number"
              value={averageQuantity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAverageQuantity(e.target.value)}
              required
              min="0"
              step="1"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-500 hover:bg-brand-600 active:bg-brand-700'} 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition`}
          >
            {isSubmitting && (
              <svg
                className="animate-spin h-5 w-5 mr-3 text-white"
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
            )}
            {isSubmitting ? 'Submitting...' : 'Submit Product'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Want to add another product?
          </span>
          <a
            href="/"
            className="ml-2 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-white"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export default AddProduct;
