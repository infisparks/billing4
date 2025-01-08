// 'use client';

// import { useState, useEffect, useMemo } from 'react';
// import { auth, database } from '../../../../firebase/firebaseConfig';
// import { ref, onValue, update, remove } from 'firebase/database';
// import { FaEdit, FaTrash } from 'react-icons/fa';
// import InputField from 'components/fields/InputField';
// import { onAuthStateChanged } from 'firebase/auth';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// interface Product {
//   id: string;
//   name: string;
//   description: string;
//   price: number;
//   createdAt: string;
// }

// function ProductList() {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [editProduct, setEditProduct] = useState<Product | null>(null);
//   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
//   const [user, setUser] = useState<any>(null);
//   const [searchTerm, setSearchTerm] = useState<string>('');

//   // Monitor authentication state
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
//       setUser(currentUser);
//       if (!currentUser) {
//         // Redirect to login if not authenticated
//         window.location.href = '/login'; // Adjust the login route as needed
//       }
//     });

//     return () => unsubscribe();
//   }, []);

//   // Fetch products from Firebase
//   useEffect(() => {
//     const productsRef = ref(database, 'products');

//     const unsubscribe = onValue(
//       productsRef,
//       (snapshot) => {
//         const data = snapshot.val();
//         const loadedProducts: Product[] = [];
//         if (data) {
//           for (const key in data) {
//             loadedProducts.push({
//               id: key,
//               name: data[key].name,
//               description: data[key].description,
//               price: data[key].price,
//               createdAt: data[key].createdAt,
//             });
//           }
//         }
//         setProducts(loadedProducts);
//         setIsLoading(false);
//       },
//       (error) => {
//         console.error('Error fetching products:', error);
//         toast.error('Error fetching products. Please try again.');
//         setIsLoading(false);
//       }
//     );

//     // Cleanup subscription on unmount
//     return () => unsubscribe();
//   }, []);

//   // Handle edit button click
//   const handleEditClick = (product: Product) => {
//     setEditProduct(product);
//   };

//   // Handle delete button click
//   const handleDeleteClick = async (productId: string) => {
//     const confirmation = window.confirm('Are you sure you want to delete this product?');
//     if (confirmation) {
//       try {
//         const productRef = ref(database, `products/${productId}`);
//         await remove(productRef);
//         toast.success('Product deleted successfully.');
//       } catch (error) {
//         console.error('Error deleting product:', error);
//         toast.error('Failed to delete product. Please try again.');
//       }
//     }
//   };

//   // Handle form submission for editing
//   const handleEditSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!editProduct) return;

//     setIsSubmitting(true);

//     try {
//       const productRef = ref(database, `products/${editProduct.id}`);
//       await update(productRef, {
//         name: editProduct.name,
//         description: editProduct.description,
//         price: Number(editProduct.price),
//         // Optionally update other fields
//       });
//       toast.success('Product updated successfully.');
//       setEditProduct(null);
//     } catch (error) {
//       console.error('Error updating product:', error);
//       toast.error('Failed to update product. Please try again.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Handle input changes in the edit form
//   const handleEditInputChange = (
//     e: React.ChangeEvent<HTMLInputElement>,
//     field: keyof Product
//   ) => {
//     if (editProduct) {
//       setEditProduct({
//         ...editProduct,
//         [field]: field === 'price' ? Number(e.target.value) : e.target.value,
//       });
//     }
//   };

//   // Handle search input change
//   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setSearchTerm(e.target.value);
//   };

//   // Filtered products based on search term
//   const filteredProducts = useMemo(() => {
//     return products.filter(
//       (product) =>
//         product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         product.description.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//   }, [products, searchTerm]);

//   // Function to truncate description
//   const truncateDescription = (description: string, length: number = 20) => {
//     return description.length > length ? description.slice(0, length) + '...' : description;
//   };

//   return (
//     <div className="w-full px-4 py-8 md:px-0 lg:py-10">
//       <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
//         <h2 className="mb-6 text-3xl font-extrabold text-gray-900 dark:text-white text-center">
//           Product List
//         </h2>

//         {/* Search Bar */}
//         <div className="mb-6">
//           <InputField
//             variant="auth"
//             label="Search Products"
//             placeholder="Search by name or description..."
//             id="searchProducts"
//             type="text"
//             value={searchTerm}
//             onChange={handleSearchChange}
//           />
//         </div>

//         {isLoading ? (
//           <p className="text-center text-gray-600 dark:text-gray-300">Loading products...</p>
//         ) : filteredProducts.length === 0 ? (
//           <p className="text-center text-gray-600 dark:text-gray-300">No products found.</p>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
//               <thead className="bg-gray-50 dark:bg-gray-700">
//                 <tr>
//                   <th
//                     scope="col"
//                     className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider"
//                   >
//                     Product Name
//                   </th>
//                   <th
//                     scope="col"
//                     className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider"
//                   >
//                     Description
//                   </th>
//                   <th
//                     scope="col"
//                     className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider"
//                   >
//                     Price (₹)
//                   </th>
//                   <th
//                     scope="col"
//                     className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider"
//                   >
//                     Created At
//                   </th>
//                   <th scope="col" className="relative px-6 py-3">
//                     <span className="sr-only">Actions</span>
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
//                 {filteredProducts.map((product) => (
//                   <tr key={product.id}>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
//                       {product.name}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
//                       {truncateDescription(product.description)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
//                       ₹{product.price.toFixed(2)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
//                       {new Date(product.createdAt).toLocaleString()}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex space-x-2">
//                       <button
//                         onClick={() => handleEditClick(product)}
//                         className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200"
//                         aria-label={`Edit ${product.name}`}
//                       >
//                         <FaEdit />
//                       </button>
//                       <button
//                         onClick={() => handleDeleteClick(product.id)}
//                         className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200"
//                         aria-label={`Delete ${product.name}`}
//                       >
//                         <FaTrash />
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {/* Edit Product Modal */}
//         {editProduct && (
//           <div
//             className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
//             role="dialog"
//             aria-modal="true"
//             aria-labelledby="editProductTitle"
//           >
//             <div className="bg-white dark:bg-gray-800 w-full max-w-md p-6 rounded-lg shadow-lg">
//               <h3
//                 id="editProductTitle"
//                 className="mb-4 text-2xl font-semibold text-gray-800 dark:text-gray-100"
//               >
//                 Edit Product
//               </h3>
//               <form onSubmit={handleEditSubmit} className="space-y-4">
//                 {/* Product Name */}
//                 <InputField
//                   variant="auth"
//                   label="Product Name*"
//                   placeholder="Enter product name"
//                   id="editProductName"
//                   type="text"
//                   value={editProduct.name}
//                   onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                     handleEditInputChange(e, 'name')
//                   }
//                   required
//                 />

//                 {/* Description */}
//                 <InputField
//                   variant="auth"
//                   label="Description"
//                   placeholder="Enter description"
//                   id="editDescription"
//                   type="text"
//                   value={editProduct.description}
//                   onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                     handleEditInputChange(e, 'description')
//                   }
//                 /> 

//                 {/* Price */}
//                 <InputField
//                   variant="auth"
//                   label="Price (₹)*"
//                   placeholder="Enter price in ₹"
//                   id="editPrice"
//                   type="number"
//                   value={editProduct.price}
//                   onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                     handleEditInputChange(e, 'price')
//                   }
//                   required
//                   min="0"
//                   step="0.01"
//                 />

//                 {/* Submit and Cancel Buttons */}
//                 <div className="flex justify-end space-x-2">
//                   <button
//                     type="button"
//                     onClick={() => setEditProduct(null)}
//                     className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={isSubmitting}
//                     className={`px-4 py-2 text-white rounded ${
//                       isSubmitting
//                         ? 'bg-gray-400 cursor-not-allowed'
//                         : 'bg-blue-600 hover:bg-blue-700'
//                     }`}
//                   >
//                     {isSubmitting ? 'Updating...' : 'Update'}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}

//         {/* Toast Notifications */}
//         <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
//       </div>
//     </div>
//   );
// }

// export default ProductList;
import React from 'react'

const page = () => {
  return (
    <div>
      
    </div>
  )
}

export default page
