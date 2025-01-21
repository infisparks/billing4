// src/app/admin/graphreport/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { database } from '../../../../firebase/firebaseConfig';
import { ref, onValue } from 'firebase/database';
import {
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendar,
  FaChartLine,
  FaFilter,
  FaSearch,
  FaCalendarAlt, // Added
  FaBox,          // Added
} from 'react-icons/fa';
import {
  format,
  isToday,
  isYesterday,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  differenceInDays,
} from 'date-fns';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

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

type FilterType = 'weekly' | 'monthly' | 'yearly' | 'customDate';

interface Summary {
  totalSales: number;
  totalOrders: number;
}

interface SalesDataPoint {
  date: string;
  sales: number;
}

function GraphReport() {
  const [sales, setSales] = useState<SoldProduct[]>([]);
  const [filteredSales, setFilteredSales] = useState<SoldProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('weekly');
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [summary, setSummary] = useState<Summary>({ totalSales: 0, totalOrders: 0 });
  const [chartData, setChartData] = useState<SalesDataPoint[]>([]);

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
          setLoading(false);
        } else {
          setSales([]);
          setFilteredSales([]);
          setSummary({ totalSales: 0, totalOrders: 0 });
          setChartData([]);
          setLoading(false);
        }
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

  useEffect(() => {
    let tempSales = [...sales];

    // Apply Filters
    const now = new Date();

    if (filter === 'weekly') {
      const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday as start
      const end = endOfWeek(now, { weekStartsOn: 1 });
      tempSales = tempSales.filter((sale) => {
        const saleDate = new Date(sale.timestamp);
        return saleDate >= start && saleDate <= end;
      });
    } else if (filter === 'monthly') {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      tempSales = tempSales.filter((sale) => {
        const saleDate = new Date(sale.timestamp);
        return saleDate >= start && saleDate <= end;
      });
    } else if (filter === 'yearly') {
      const start = startOfYear(now);
      const end = endOfYear(now);
      tempSales = tempSales.filter((sale) => {
        const saleDate = new Date(sale.timestamp);
        return saleDate >= start && saleDate <= end;
      });
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
    }

    setFilteredSales(tempSales);
    calculateSummary(tempSales);
    generateChartData(tempSales);
  }, [filter, customDateRange, sales]);

  const calculateSummary = (salesList: SoldProduct[]) => {
    const totalSales = salesList.reduce((acc, sale) => acc + sale.total, 0);
    const totalOrders = salesList.length;
    setSummary({ totalSales, totalOrders });
  };

  const generateChartData = (salesList: SoldProduct[]) => {
    const dataMap: { [key: string]: number } = {};

    salesList.forEach((sale) => {
      const saleDate = new Date(sale.timestamp);
      let key = '';

      if (filter === 'weekly') {
        key = format(saleDate, 'EEE'); // Mon, Tue, etc.
      } else if (filter === 'monthly') {
        const weekNumber = getWeekNumber(saleDate);
        key = `Week ${weekNumber}`;
      } else if (filter === 'yearly') {
        key = format(saleDate, 'MMM'); // Jan, Feb, etc.
      } else if (filter === 'customDate') {
        key = format(saleDate, 'PPP'); // e.g., Sep 4, 2023
      }

      if (dataMap[key]) {
        dataMap[key] += sale.total;
      } else {
        dataMap[key] = sale.total;
      }
    });

    // Convert to array and sort based on filter
    let chartArray: SalesDataPoint[] = Object.keys(dataMap).map((key) => ({
      date: key,
      sales: parseFloat(dataMap[key].toFixed(2)),
    }));

    if (filter === 'weekly') {
      // Ensure order from Monday to Sunday
      const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      chartArray.sort((a, b) => order.indexOf(a.date) - order.indexOf(b.date));
    } else if (filter === 'monthly') {
      // Sort by week number
      chartArray.sort((a, b) => {
        const weekA = parseInt(a.date.split(' ')[1]);
        const weekB = parseInt(b.date.split(' ')[1]);
        return weekA - weekB;
      });
    } else if (filter === 'yearly') {
      // Sort by month
      const monthOrder = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      chartArray.sort((a, b) => monthOrder.indexOf(a.date) - monthOrder.indexOf(b.date));
    } else if (filter === 'customDate') {
      // Sort by date
      chartArray.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    }

    // Calculate trend
    chartArray = chartArray.map((dataPoint, index, array) => {
      if (index === 0) {
        return { ...dataPoint, trend: 'none' };
      }
      const previous = array[index - 1].sales;
      const current = dataPoint.sales;
      let trend: 'up' | 'down' | 'none' = 'none';
      if (current > previous) trend = 'up';
      else if (current < previous) trend = 'down';
      return { ...dataPoint, trend };
    });

    setChartData(chartArray);
  };

  // Helper function to get week number
  const getWeekNumber = (date: Date): number => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const diff = differenceInDays(date, start);
    return Math.ceil((diff + 1) / 7);
  };

  const handleFilterChange = (selectedFilter: FilterType) => {
    setFilter(selectedFilter);
    // Reset custom date range if not customDate
    if (selectedFilter !== 'customDate') {
      setCustomDateRange({ start: '', end: '' });
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
          <p className="text-lg text-gray-700 dark:text-gray-300">Loading graph report...</p>
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
          Sales Graph Report
        </h2>

        {/* Filter Section */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
            {/* Filter Buttons */}
            <div className="flex flex-wrap space-x-2">
              <button
                onClick={() => handleFilterChange('weekly')}
                className={`flex items-center px-4 py-2 border rounded-md text-sm font-medium transition ${
                  filter === 'weekly'
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FaCalendarWeek className="mr-2" />
                Weekly
              </button>
              <button
                onClick={() => handleFilterChange('monthly')}
                className={`flex items-center px-4 py-2 border rounded-md text-sm font-medium transition ${
                  filter === 'monthly'
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FaCalendarAlt className="mr-2" />
                Monthly
              </button>
              <button
                onClick={() => handleFilterChange('yearly')}
                className={`flex items-center px-4 py-2 border rounded-md text-sm font-medium transition ${
                  filter === 'yearly'
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FaCalendar className="mr-2" />
                Yearly
              </button>
              <button
                onClick={() => handleFilterChange('customDate')}
                className={`flex items-center px-4 py-2 border rounded-md text-sm font-medium transition ${
                  filter === 'customDate'
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FaFilter className="mr-2" />
                Custom Date
              </button>
            </div>

            {/* Search Bar (Optional) */}
            {/* <div className="relative w-full max-w-md">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div> */}
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
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center">
            <FaChartLine className="text-green-500 text-4xl mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sales (₹)</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                {summary.totalSales.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex items-center">
            <FaBox className="text-blue-500 text-4xl mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                {summary.totalOrders}
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Line Chart for Sales Over Time */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaChartLine className="mr-2" />
              Sales Over Time
            </h3>
            {chartData.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No data available for the selected period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#4ADE80" // Green color
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bar Chart for Sales Comparison */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaChartLine className="mr-2" />
              Sales Comparison
            </h3>
            {chartData.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No data available for the selected period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                  <Bar
                    dataKey="sales"
                    fill="#F87171" // Red color
                    barSize={30}
                    label={{ position: 'top', formatter: (value: number) => `₹${value.toFixed(2)}` }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GraphReport;
