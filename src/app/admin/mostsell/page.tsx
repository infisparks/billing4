// src/app/admin/mostsell/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { database } from '../../../../firebase/firebaseConfig';
import { ref, onValue } from 'firebase/database';
import {
  FaBox,
  FaInfoCircle,
  FaDollarSign,
  FaCalendarAlt,
  FaSearch,
  FaFilter,
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendar,
} from 'react-icons/fa';
import {
  format,
  isToday,
  isYesterday,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Product {
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

interface SoldProduct {
  id: string;
  customerName: string;
  customerPhone: string;
  discount: number;
  paymentMethod: 'Online' | 'Cash';
  products: Product[];
  timestamp: string;
  total: number;
}

type FilterType = 'all' | 'today' | 'yesterday' | 'customDate' | 'customMonth' | 'customYear';

interface Summary {
  totalProductsSold: number;
}

interface ProductSalesCount {
  name: string;
  count: number;
  revenue: number;
}

function MostSell() {
  const [sales, setSales] = useState<SoldProduct[]>([]);
  const [filteredSales, setFilteredSales] = useState<SoldProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [customMonth, setCustomMonth] = useState<{ month: string; year: string }>({
    month: '',
    year: '',
  });
  const [customYear, setCustomYear] = useState<{ year: string }>({
    year: '',
  });

  // Summary state
  const [summary, setSummary] = useState<Summary>({ totalProductsSold: 0 });

  // Product sales count
  const [productSales, setProductSales] = useState<ProductSalesCount[]>([]);

  useEffect(() => {
    const salesRef = ref(database, 'sales');
    const unsubscribe = onValue(
      salesRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const salesList: SoldProduct[] = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));

          // **Filter out sales with invalid or missing 'timestamp'**
          const validSalesList = salesList.filter((sale) => {
            if (!sale.timestamp || typeof sale.timestamp !== 'string') {
              console.warn(`Sale with ID ${sale.id} is missing a valid 'timestamp' field.`);
              return false;
            }
            const parsedDate = Date.parse(sale.timestamp);
            if (isNaN(parsedDate)) {
              console.warn(`Sale with ID ${sale.id} has an invalid 'timestamp' date.`);
              return false;
            }
            return true;
          });

          // **Sort the validSalesList in descending order based on timestamp**
          validSalesList.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

          setSales(validSalesList);
          setFilteredSales(validSalesList);
          calculateSummary(validSalesList);
          aggregateProductSales(validSalesList);
        } else {
          setSales([]);
          setFilteredSales([]);
          setSummary({ totalProductsSold: 0 });
          setProductSales([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching sales:', error);
        setError('Failed to fetch sales.');
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Calculate summary
  const calculateSummary = (salesList: SoldProduct[]) => {
    let totalProducts = 0;
    salesList.forEach((sale) => {
      sale.products.forEach((product) => {
        totalProducts += product.quantity;
      });
    });
    setSummary({ totalProductsSold: totalProducts });
  };

  // Aggregate product sales counts
  const aggregateProductSales = (salesList: SoldProduct[]) => {
    const productMap: { [key: string]: { count: number; revenue: number } } = {};

    salesList.forEach((sale) => {
      sale.products.forEach((product) => {
        if (productMap[product.name]) {
          productMap[product.name].count += product.quantity;
          productMap[product.name].revenue += product.lineTotal;
        } else {
          productMap[product.name] = { count: product.quantity, revenue: product.lineTotal };
        }
      });
    });

    const aggregated: ProductSalesCount[] = Object.keys(productMap).map((key) => ({
      name: key,
      count: productMap[key].count,
      revenue: productMap[key].revenue,
    }));

    // Sort by count descending
    aggregated.sort((a, b) => b.count - a.count);

    setProductSales(aggregated);
  };

  useEffect(() => {
    let tempSales = [...sales];

    // Apply Search Filter
    if (searchTerm.trim() !== '') {
      const lowercasedTerm = searchTerm.toLowerCase();
      tempSales = tempSales.filter(
        (sale) =>
          sale.customerName.toLowerCase().includes(lowercasedTerm) ||
          sale.customerPhone.includes(lowercasedTerm) ||
          sale.products.some(
            (product) =>
              product.name.toLowerCase().includes(lowercasedTerm) ||
              product.price.toString().includes(lowercasedTerm)
          )
      );
    }

    // Apply Date Filters
    if (filter === 'today') {
      tempSales = tempSales.filter((sale) => isToday(parseISO(sale.timestamp)));
    } else if (filter === 'yesterday') {
      tempSales = tempSales.filter((sale) => isYesterday(parseISO(sale.timestamp)));
    } else if (filter === 'customDate') {
      const { start, end } = customDateRange;
      if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        tempSales = tempSales.filter((sale) => {
          const saleDate = new Date(sale.timestamp);
          return saleDate >= startDate && saleDate <= endDate;
        });
      }
    } else if (filter === 'customMonth') {
      const { month, year } = customMonth;
      if (month && year) {
        tempSales = tempSales.filter((sale) => {
          const saleDate = new Date(sale.timestamp);
          return (
            saleDate.getMonth() + 1 === parseInt(month) &&
            saleDate.getFullYear() === parseInt(year)
          );
        });
      }
    } else if (filter === 'customYear') {
      const { year } = customYear;
      if (year) {
        tempSales = tempSales.filter((sale) => {
          const saleDate = new Date(sale.timestamp);
          return saleDate.getFullYear() === parseInt(year);
        });
      }
    }

    setFilteredSales(tempSales);
    calculateSummary(tempSales);
    aggregateProductSales(tempSales);
  }, [searchTerm, filter, customDateRange, customMonth, customYear, sales]);

  const handleFilterChange = (selectedFilter: FilterType) => {
    setFilter(selectedFilter);
    // Reset custom filters when changing the main filter
    if (selectedFilter !== 'customDate') {
      setCustomDateRange({ start: '', end: '' });
    }
    if (selectedFilter !== 'customMonth') {
      setCustomMonth({ month: '', year: '' });
    }
    if (selectedFilter !== 'customYear') {
      setCustomYear({ year: '' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-brand-500 mx-auto mb-4"
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
          <p className="text-lg text-gray-700 dark:text-gray-300">Loading most sold products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 sm:p-8 lg:p-10">
      <ToastContainer />

      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-8 text-center">
          Most Sold Products
        </h2>

        {/* Summary Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center justify-between mb-10">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Products Sold</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
              {summary.totalProductsSold}
            </p>
          </div>
          <FaBox className="text-brand-500 text-6xl" />
        </div>

        {/* Filter Section */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
            {/* Filter Buttons */}
            <div className="flex flex-wrap space-x-2">
              <button
                onClick={() => handleFilterChange('all')}
                className={`flex items-center px-4 py-2 border rounded-md text-sm font-medium transition ${
                  filter === 'all'
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FaFilter className="mr-2" />
                All Time
              </button>
              <button
                onClick={() => handleFilterChange('today')}
                className={`px-4 py-2 border rounded-md text-sm font-medium transition ${
                  filter === 'today'
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => handleFilterChange('yesterday')}
                className={`px-4 py-2 border rounded-md text-sm font-medium transition ${
                  filter === 'yesterday'
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Yesterday
              </button>
              <button
                onClick={() => handleFilterChange('customDate')}
                className={`px-4 py-2 border rounded-md text-sm font-medium transition ${
                  filter === 'customDate'
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Custom Date
              </button>
              <button
                onClick={() => handleFilterChange('customMonth')}
                className={`px-4 py-2 border rounded-md text-sm font-medium transition ${
                  filter === 'customMonth'
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Custom Month
              </button>
              <button
                onClick={() => handleFilterChange('customYear')}
                className={`px-4 py-2 border rounded-md text-sm font-medium transition ${
                  filter === 'customYear'
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Custom Year
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative w-full max-w-md">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {filter === 'customDate' && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label htmlFor="startDate" className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={customDateRange.start}
                  onChange={(e) =>
                    setCustomDateRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="endDate" className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={customDateRange.end}
                  onChange={(e) =>
                    setCustomDateRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>
            </div>
          )}

          {/* Custom Month Picker */}
          {filter === 'customMonth' && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label htmlFor="month" className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Month
                </label>
                <select
                  id="month"
                  value={customMonth.month}
                  onChange={(e) =>
                    setCustomMonth((prev) => ({ ...prev, month: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                >
                  <option value="">Select Month</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {format(new Date(0, i), 'MMMM')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label htmlFor="year" className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  id="year"
                  placeholder="e.g., 2024"
                  value={customMonth.year}
                  onChange={(e) =>
                    setCustomMonth((prev) => ({ ...prev, year: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>
            </div>
          )}

          {/* Custom Year Picker */}
          {filter === 'customYear' && (
            <div className="mt-6 flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0">
              <div className="flex flex-col">
                <label htmlFor="yearOnly" className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  id="yearOnly"
                  placeholder="e.g., 2024"
                  value={customYear.year}
                  onChange={(e) =>
                    setCustomYear({ year: e.target.value })
                  }
                  className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Top Products Table */}
        <div className="overflow-x-auto rounded-lg shadow-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Quantity Sold
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Revenue (₹)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {productSales.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {product.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    ₹{product.revenue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* No Products Found */}
        {productSales.length === 0 && (
          <div className="mt-6 text-center text-gray-600 dark:text-gray-400">
            No products found for the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}

export default MostSell;
