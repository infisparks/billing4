// src/app/admin/selllist/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { database, storage } from '../../../../firebase/firebaseConfig';
import { ref as dbRef, onValue, update } from 'firebase/database';
import {
  FaBox,
  FaDollarSign,
  FaEdit,
  FaSave,
} from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Define a Product with an ID
interface ProductWithId {
  id: string;
  name: string;
  price: number;
  quantity: number;
  averageQuantity: number;
}

const ProductList = () => {
  // Products are now stored as an array of ProductWithId
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithId[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Editing state uses product IDs
  const [editing, setEditing] = useState<{ [key: string]: boolean }>({});
  const [editedData, setEditedData] = useState<{ [key: string]: ProductWithId }>({});

  useEffect(() => {
    const productsRef = dbRef(database, 'products');

    const unsubscribe = onValue(
      productsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Convert products object to array with IDs
          const productList: ProductWithId[] = Object.entries(data).map(([id, product]) => ({
            id,
            name: (product as any).name,
            price: (product as any).price,
            quantity: (product as any).quantity,
            averageQuantity: (product as any).averageQuantity,
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

  const handleEdit = (productId: string) => {
    setEditing((prev) => ({ ...prev, [productId]: true }));
    const productToEdit = products.find((p) => p.id === productId);
    if (productToEdit) {
      setEditedData((prev) => ({
        ...prev,
        [productId]: { ...productToEdit },
      }));
    }
  };

  const handleSave = async (productId: string) => {
    const productRef = dbRef(database, `products/${productId}`);
    const updatedProduct = editedData[productId];
    try {
      await update(productRef, {
        name: updatedProduct.name,
        price: updatedProduct.price,
        quantity: updatedProduct.quantity,
        averageQuantity: updatedProduct.averageQuantity,
      });
      setEditing((prev) => ({ ...prev, [productId]: false }));
      toast.success('Product updated successfully!');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product.');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    productId: string
  ) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [name]:
          name === 'price' || name === 'quantity' || name === 'averageQuantity'
            ? parseFloat(value) || 0
            : value,
      },
    }));
  };

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <ToastContainer />
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 text-center">
          Product List
        </h2>

        {/* Search Bar */}
        <div className="mb-6 flex justify-center">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <thead>
              <tr>
                <th className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Price (₹)
                </th>
                <th className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Average Quantity
                </th>
                <th className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {/* Product Name */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {editing[product.id] ? (
                      <input
                        type="text"
                        name="name"
                        value={editedData[product.id]?.name || product.name}
                        onChange={(e) => handleChange(e, product.id)}
                        className="border border-gray-300 dark:border-gray-700 text-blue-900 px-2 py-1 rounded-md w-full"
                      />
                    ) : (
                      product.name
                    )}
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-100 text-blue-900 ">
                    {editing[product.id] ? (
                      <input
                        type="text"
                        name="price"
                        value={editedData[product.id]?.price || product.price}
                        onChange={(e) => handleChange(e, product.id)}
                        className="border border-gray-300 dark:border-gray-700 text-blue-900  px-2 py-1 rounded-md w-full"
                      />
                    ) : (
                      product.price.toFixed(2)
                    )}
                  </td>

                  {/* Quantity */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {editing[product.id] ? (
                      <input
                        type="text"
                        name="quantity"
                        value={editedData[product.id]?.quantity || product.quantity}
                        onChange={(e) => handleChange(e, product.id)}
                        className="border border-gray-300 dark:border-gray-700 text-blue-900  px-2 py-1 rounded-md w-full"
                      />
                    ) : (
                      product.quantity
                    )}
                  </td>

                  {/* Average Quantity */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {editing[product.id] ? (
                      <input
                        type="text"
                        name="averageQuantity"
                        value={editedData[product.id]?.averageQuantity || product.averageQuantity}
                        onChange={(e) => handleChange(e, product.id)}
                        className="border border-gray-300 dark:border-gray-700 text-blue-900  px-2 py-1 rounded-md w-full"
                      />
                    ) : (
                      product.averageQuantity
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 ">
                    {editing[product.id] ? (
                      <button
                        onClick={() => handleSave(product.id)}
                        className="text-green-500 hover:text-green-700"
                      >
                        <FaSave />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEdit(product.id)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <FaEdit />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
