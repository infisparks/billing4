// src/app/admin/sell/page.tsx
'use client';

import { useState, useEffect } from 'react';
import InputField from 'components/fields/InputField';
import { database, storage } from '../../../../firebase/firebaseConfig';
import {
  ref as dbRef,
  push,
  onValue,
  runTransaction,
  query,
  orderByChild,
  equalTo,
} from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

import {
  FaBox,
  FaDollarSign,
  FaSortNumericDown,
  FaChartLine,
  FaPlus,
  FaTrash,
} from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';

// --- Imports for PDF and Notifications ---
import jsPDF from 'jspdf';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 1) Convert an image (like letterhead) to Base64
async function getImageBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image at ${url}`);
    }
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          resolve(reader.result.toString());
        } else {
          reject('Failed to convert image to Base64.');
        }
      };
      reader.onerror = () => {
        reject('Failed to convert image to Base64.');
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    // If image fetching fails, return empty string to proceed without it
    return '';
  }
}

// 2) Upload PDF blob to Firebase Storage and get a public URL
async function uploadPDFToFirebaseStorage(pdfBlob: Blob, fileName: string): Promise<string> {
  try {
    // Create a storage reference
    const pdfRef = storageRef(storage, `invoices/${fileName}`);

    // Upload the PDF blob
    const snapshot = await uploadBytes(pdfRef, pdfBlob, {
      contentType: 'application/pdf',
    });

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading PDF to Firebase Storage:', error);
    throw error;
  }
}

// 3) Send WhatsApp message with the PDF link
async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string,
  mediaUrl: string,
  filename: string,
  token: string
) {
  // Construct the recipient phone number (India code assumed: +91)
  const recipientNumber = `91${phoneNumber}`;

  const apiUrl = 'https://wa.medblisss.com/send-image-url';

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        number: recipientNumber,
        imageUrl: mediaUrl,
        caption: `Hello, here is your invoice: ${filename}`,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to send WhatsApp message.');
    }

    toast.success('Invoice PDF sent via WhatsApp!');
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    toast.error('Failed to send WhatsApp message.');
  }
}

// 4) Create PDF with jsPDF, then upload to Firebase Storage and return URL
async function createAndUploadPDF(saleData: any) {
  const doc = new jsPDF('p', 'mm', 'a4');
  try {
    // Optional: Add letterhead or background image
    const imageBase64 = await getImageBase64('/letterhead.png');
    if (imageBase64) {
      doc.addImage(imageBase64, 'PNG', 0, 0, 210, 297);
    }

    doc.setFontSize(16);
    doc.setTextColor(12, 29, 73);
    const leftMargin = 20;
    const rightMargin = 190;
    const topMargin = 50;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(17);

    // Using saleData to fill in info
    doc.text(`Name: ${saleData.customerName}`, leftMargin, topMargin);
    doc.text(`Phone: ${saleData.customerPhone}`, leftMargin, topMargin + 10);

    const currentDate = new Date(saleData.timestamp).toLocaleDateString();
    doc.text(`Date: ${currentDate}`, rightMargin - 60, topMargin);

    // Payment Method (Printed below the date)
    doc.text(`Payment: ${saleData.paymentMethod}`, rightMargin - 60, topMargin + 10);

    // Table headers
    doc.setFontSize(16);
    let yPosition = topMargin + 30;
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(12, 29, 73);
    doc.text('Product', 25, yPosition, { align: 'left' });
    doc.text('Qty', 130, yPosition, { align: 'right' });
    doc.text('Price (₹)', 160, yPosition, { align: 'right' });

    yPosition += 5;
    doc.setLineWidth(0.3);
    doc.line(leftMargin, yPosition, rightMargin, yPosition);
    yPosition += 10;

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(12, 29, 73);

    // List products
    saleData.products.forEach((prod: any, index: number) => {
      doc.text(`${index + 1}. ${prod.name}`, 25, yPosition, { align: 'left' });
      doc.text(`${prod.quantity}`, 130, yPosition, { align: 'right' });
      doc.text(`${prod.lineTotal.toFixed(2)}`, 160, yPosition, { align: 'right' });
      yPosition += 10;
    });

    // Subtotal, discount, total
    const subtotal = saleData.products.reduce(
      (acc: number, curr: any) => acc + curr.lineTotal,
      0
    );
    const discountAmount = saleData.discount || 0;
    const total = subtotal - discountAmount;

    yPosition += 5;
    doc.line(leftMargin, yPosition, rightMargin, yPosition);
    yPosition += 10;

    doc.text('Subtotal:', 130, yPosition, { align: 'right' });
    doc.text(`${subtotal.toFixed(2)}`, 160, yPosition, { align: 'right' });
    yPosition += 10;

    if (discountAmount > 0) {
      doc.text('Discount:', 130, yPosition, { align: 'right' });
      doc.text(`${discountAmount.toFixed(2)}`, 160, yPosition, {
        align: 'right',
      });
      yPosition += 10;
    }

    doc.setFont('Helvetica', 'bold');
    doc.text('Total:', 130, yPosition, { align: 'right' });
    doc.text(`${total.toFixed(2)}`, 160, yPosition, { align: 'right' });

    // Footer
    yPosition += 20;
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'normal');
    doc.text('Thank you for your business!', 105, yPosition + 20, { align: 'center' });
    doc.text(
      `We appreciate your trust in us, ${saleData.customerName}. Have a wonderful day!`,
      105,
      yPosition + 30,
      { align: 'center' }
    );

    // Convert PDF to Blob
    const pdfBlob = doc.output('blob');

    // Construct a file name
    const fileName = `Invoice_${new Date().toISOString().replace(/:/g, '-')}.pdf`;

    // 2) Upload to Firebase Storage
    const uploadedURL = await uploadPDFToFirebaseStorage(pdfBlob, fileName);

    // Return the link and filename for WhatsApp
    return { downloadURL: uploadedURL, fileName };
  } catch (error) {
    console.error('Error generating/uploading PDF:', error);
    toast.error('Failed to generate or upload PDF.');
    return null;
  }
}

function AddProduct() {
  // Customer Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Products State (now includes 'quantity' with default value 1)
  const [products, setProducts] = useState([
    { id: uuidv4(), name: '', price: 0, quantity: 1 },
  ]);

  // Discount
  const [discount, setDiscount] = useState(0);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'Online' | 'Cash'>('Cash');

  // Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // All Products from Firebase for Auto-Suggest
  const [allProducts, setAllProducts] = useState<any[]>([]);

  // Suggestions State
  const [suggestions, setSuggestions] = useState<{ [key: string]: any[] }>({});

  // WhatsApp token from Firebase
  const [waToken, setWaToken] = useState<string>('');

  // Fetch the WhatsApp token from the DB
  useEffect(() => {
    const tokenRef = dbRef(database, 'token/token');
    const unsub = onValue(tokenRef, (snapshot) => {
      if (snapshot.exists()) {
        setWaToken(snapshot.val().toString());
      }
    });
    return () => unsub();
  }, []);

  // Fetch products for auto-suggestion
  useEffect(() => {
    const productsRef = dbRef(database, 'products');
    const unsubscribe = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedProducts: any[] = [];
      for (let key in data) {
        loadedProducts.push({ id: key, ...data[key] });
      }
      setAllProducts(loadedProducts);
    });

    return () => unsubscribe();
  }, []);

  // Auto-Fill Customer Name if phone was used before
  useEffect(() => {
    if (customerPhone.length === 10) {
      const salesQueryRef = query(
        dbRef(database, 'sales'),
        orderByChild('customerPhone'),
        equalTo(customerPhone)
      );

      const unsubscribeSales = onValue(salesQueryRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const saleKeys = Object.keys(data);
          const lastKey = saleKeys[saleKeys.length - 1];
          const lastSale = data[lastKey];
          setCustomerName(lastSale.customerName);
        }
      });

      return () => unsubscribeSales();
    }
  }, [customerPhone]);

  // Handle Customer Phone Input
  const handleCustomerPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow up to 10 digits
    if (/^\d{0,10}$/.test(value)) {
      setCustomerPhone(value);
    }
  };

  // Handle Product Name Input with Auto-Suggest
  const handleProductNameChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    const updatedProducts = [...products];
    updatedProducts[index].name = value;

    // Find suggestions
    if (value.length > 0) {
      const filtered = allProducts.filter((product) =>
        product.name.toLowerCase().startsWith(value.toLowerCase())
      );
      setSuggestions((prev) => ({
        ...prev,
        [updatedProducts[index].id]: filtered,
      }));
    } else {
      setSuggestions((prev) => ({
        ...prev,
        [updatedProducts[index].id]: [],
      }));
    }

    // Reset price if product name changes
    updatedProducts[index].price = 0;
    setProducts(updatedProducts);
  };

  // Handle Product Selection from Suggestions
  const handleProductSelect = (product: any, index: number) => {
    const updatedProducts = [...products];
    updatedProducts[index].name = product.name;
    updatedProducts[index].price = product.price;
    setProducts(updatedProducts);

    setSuggestions((prev) => ({
      ...prev,
      [updatedProducts[index].id]: [],
    }));
  };

  // Handle Price Change
  const handlePriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      const updatedProducts = [...products];
      updatedProducts[index].price = value === '' ? 0 : parseFloat(value);
      setProducts(updatedProducts);
    }
  };

  // Handle Quantity Change
  const handleQuantityChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;
    if (/^\d{0,3}$/.test(value)) {
      const newQty = value === '' ? 1 : parseInt(value, 10);
      const updatedProducts = [...products];
      updatedProducts[index].quantity = newQty > 0 ? newQty : 1; // min 1
      setProducts(updatedProducts);
    }
  };

  // Add More Product Rows
  const handleAddProduct = () => {
    setProducts([...products, { id: uuidv4(), name: '', price: 0, quantity: 1 }]);
  };

  // Remove Product Row
  const handleRemoveProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
    setSuggestions((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  // Handle Discount Change
  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setDiscount(Number(value));
    }
  };

  // Handle Payment Method Change
  const handlePaymentMethodChange = (method: 'Online' | 'Cash') => {
    setPaymentMethod(method);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    if (!customerName.trim()) {
      toast.error('Please fill in all customer details.');
      return;
    }
    if (customerPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number.');
      return;
    }
    if (products.length === 0) {
      toast.error('Please add at least one product.');
      return;
    }

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      if (!product.name.trim()) {
        toast.error(`Please enter the name for product ${i + 1}.`);
        return;
      }
      if (product.price <= 0) {
        toast.error(`Please enter a valid price for product ${i + 1}.`);
        return;
      }
      if (product.quantity <= 0) {
        toast.error(`Quantity for product ${i + 1} cannot be 0.`);
        return;
      }
    }

    // Calculate Subtotal (Price * Quantity)
    const subtotal = products.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

    if (discount < 0) {
      toast.error('Discount cannot be negative.');
      return;
    }
    if (discount > subtotal) {
      toast.error('Discount cannot exceed the subtotal.');
      return;
    }

    // Overall total
    const total = subtotal - discount;

    // Build saleData
    const saleData = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      products: products.map((p) => ({
        name: p.name,
        price: p.price,
        quantity: p.quantity,
        lineTotal: p.price * p.quantity,
      })),
      discount,
      total,
      paymentMethod,
      timestamp: new Date().toISOString(),
    };

    try {
      setIsSubmitting(true);

      // 1) Decrement product quantities in Firebase
      for (const soldProduct of saleData.products) {
        const matchedProduct = allProducts.find(
          (p) => p.name.toLowerCase() === soldProduct.name.toLowerCase()
        );
        if (matchedProduct) {
          const productQuantityRef = dbRef(
            database,
            `products/${matchedProduct.id}/quantity`
          );

          // Subtract the line-item quantity
          await runTransaction(productQuantityRef, (currentQuantity) => {
            if (currentQuantity === null) {
              return 0;
            }
            return currentQuantity - soldProduct.quantity;
          })
            .then((result) => {
              if (!result.committed) {
                console.warn(
                  `Transaction aborted for product ${matchedProduct.name}.`
                );
                toast.error(
                  `Failed to update quantity for product ${matchedProduct.name}.`
                );
              }
            })
            .catch((error) => {
              console.error(
                `Transaction failed for product ${matchedProduct.name}:`,
                error
              );
              toast.error(
                `Error updating quantity for product ${matchedProduct.name}.`
              );
            });
        } else {
          console.warn(`Product ${soldProduct.name} not found in allProducts.`);
          toast.error(
            `Product ${soldProduct.name} not found. Quantity not updated.`
          );
        }
      }

      // 2) Push Sale to Firebase Realtime Database
      const salesRef = dbRef(database, 'sales');
      await push(salesRef, saleData);

      toast.success('Sale recorded successfully! Generating PDF...');

      // 3) Generate PDF, upload to Firebase Storage, then send via WhatsApp
      const pdfResult = await createAndUploadPDF(saleData);
      if (pdfResult && pdfResult.downloadURL) {
        // Make sure we have a valid WhatsApp token before sending
        if (!waToken) {
          toast.error('WhatsApp token not loaded. Cannot send message.');
        } else {
          await sendWhatsAppMessage(
            customerPhone,
            `Hello ${customerName}, here is your invoice.`,
            pdfResult.downloadURL,
            pdfResult.fileName,
            waToken
          );
        }
      }

      // 4) Reset Form
      setCustomerName('');
      setCustomerPhone('');
      setDiscount(0);
      setPaymentMethod('Cash');
      setProducts([{ id: uuidv4(), name: '', price: 0, quantity: 1 }]);
    } catch (error) {
      console.error('Error recording sale:', error);
      toast.error('Failed to record sale. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <ToastContainer />

      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h2 className="mb-6 text-3xl font-extrabold text-gray-900 dark:text-white text-center">
          Record New Sale
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Name */}
          <div className="relative">
            <FaBox className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <InputField
              variant="auth"
              extra="mb-3 pl-10"
              label="Customer Name*"
              placeholder="Enter customer name"
              id="customerName"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>

          {/* Customer Phone */}
          <div className="relative">
            <FaSortNumericDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <InputField
              variant="auth"
              extra="mb-3 pl-10"
              label="Customer Phone*"
              placeholder="Enter 10-digit phone number"
              id="customerPhone"
              type="text"
              value={customerPhone}
              onChange={handleCustomerPhoneChange}
              required
            />
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Method*
            </label>
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Online"
                  checked={paymentMethod === 'Online'}
                  onChange={() => handlePaymentMethodChange('Online')}
                  className="form-radio h-5 w-5 text-brand-600"
                  required
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Online</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash"
                  checked={paymentMethod === 'Cash'}
                  onChange={() => handlePaymentMethodChange('Cash')}
                  className="form-radio h-5 w-5 text-brand-600"
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300">Cash</span>
              </label>
            </div>
          </div>

          {/* Products */}
          <div className="space-y-4">
            {products.map((product, index) => (
              <div key={product.id} className="relative border p-4 rounded-md">
                {/* Product Name */}
                <div className="">
                  <div className="relative flex-1 mr-4">
                    <FaBox className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <InputField
                      variant="auth"
                      extra="mb-3 pl-10"
                      label={`Product ${index + 1} Name*`}
                      placeholder="Start typing product name"
                      id={`productName-${product.id}`}
                      type="text"
                      value={product.name}
                      onChange={(e) => handleProductNameChange(e, index)}
                      required
                    />
                    {/* Suggestions Dropdown */}
                    {suggestions[product.id] && suggestions[product.id].length > 0 && (
                      <ul className="absolute z-10 bg-white border border-gray-300 w-full mt-1 max-h-40 overflow-y-auto rounded-md shadow-lg">
                        {suggestions[product.id].map((sugg) => (
                          <li
                            key={sugg.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleProductSelect(sugg, index)}
                          >
                            {sugg.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Quantity Input */}
                  <div className="relative w-full">
                    <FaSortNumericDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={product.quantity}
                      onChange={(e) => handleQuantityChange(e, index)}
                      className="w-full px-4 py-2 text-lg border border-gray-300 bg-[#2D396B] text-white rounded-lg pl-10"
                      placeholder="Qty"
                      min="1"
                      step="1"
                      required
                    />
                  </div>
                </div>

                {/* Product Price */}
                <div className="relative mt-2">
                  <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 " />
                  <input
                    type="number"
                    value={product.price === 0 ? '' : product.price}
                    onChange={(e) => handlePriceChange(e, index)}
                    className="w-full px-4 py-2 text-lg border border-gray-300 rounded-lg pl-10"
                    placeholder="Enter product price"
                    required
                    min="0.01"
                    step="0.01"
                  />
                </div>

                {/* Remove Product Button */}
                {products.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(product.id)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    aria-label="Remove product"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            ))}

            {/* Add More Products Button */}
            <button
              type="button"
              onClick={handleAddProduct}
              className="flex items-center text-white hover:text-brand-600"
            >
              <FaPlus className="mr-2 text-white" /> Add More Products
            </button>
          </div>

          {/* Discount */}
          <div className="relative">
            <FaChartLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <InputField
              variant="auth"
              extra="mb-3 pl-10"
              label="Discount (₹)"
              placeholder="Enter discount amount"
              id="discount"
              type="number"
              value={discount}
              onChange={handleDiscountChange}
              min="0"
              step="0.01"
            />
          </div>

          {/* Sell Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-brand-500 hover:bg-brand-600 active:bg-brand-700'
              } 
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
            {isSubmitting ? 'Processing...' : 'Sell'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Want to record another sale?
          </span>
          <a
            href="/admin/selllist"
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
