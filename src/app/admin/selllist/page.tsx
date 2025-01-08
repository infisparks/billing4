// pages/SellList.tsx
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
  FaMoneyCheckAlt,
  FaCreditCard,
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

interface SoldProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  paymentMethod: 'online' | 'cash';
  phoneNumber: string;
  productId: string;
  soldAt: string;
}

type FilterType = 'all' | 'today' | 'yesterday' | 'customDate' | 'customMonth';

interface Summary {
  total: number;
  online: number;
  cash: number;
}

function SellList() {
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

  // Summary states
  const [todaySummary, setTodaySummary] = useState<Summary>({ total: 0, online: 0, cash: 0 });
  const [yesterdaySummary, setYesterdaySummary] = useState<Summary>({ total: 0, online: 0, cash: 0 });
  const [monthSummary, setMonthSummary] = useState<Summary>({ total: 0, online: 0, cash: 0 });
  const [yearSummary, setYearSummary] = useState<Summary>({ total: 0, online: 0, cash: 0 });

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
          setSales(salesList);
          setFilteredSales(salesList);
          calculateSummaries(salesList);
        } else {
          setSales([]);
          setFilteredSales([]);
          resetSummaries();
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

  // Calculate summaries
  const calculateSummaries = (salesList: SoldProduct[]) => {
    const today = new Date();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(today.getDate() - 1);

    const todaySum: Summary = { total: 0, online: 0, cash: 0 };
    const yesterdaySum: Summary = { total: 0, online: 0, cash: 0 };
    const monthSum: Summary = { total: 0, online: 0, cash: 0 };
    const yearSum: Summary = { total: 0, online: 0, cash: 0 };

    salesList.forEach((sale) => {
      const saleDate = parseISO(sale.soldAt);

      // Today
      if (isToday(saleDate)) {
        todaySum.total += sale.price;
        sale.paymentMethod === 'online' ? (todaySum.online += sale.price) : (todaySum.cash += sale.price);
      }

      // Yesterday
      if (isYesterday(saleDate)) {
        yesterdaySum.total += sale.price;
        sale.paymentMethod === 'online'
          ? (yesterdaySum.online += sale.price)
          : (yesterdaySum.cash += sale.price);
      }

      // This Month
      const startMonth = startOfMonth(new Date());
      const endMonth = endOfMonth(new Date());
      if (saleDate >= startMonth && saleDate <= endMonth) {
        monthSum.total += sale.price;
        sale.paymentMethod === 'online' ? (monthSum.online += sale.price) : (monthSum.cash += sale.price);
      }

      // This Year
      const startYear = startOfYear(new Date());
      const endYear = endOfYear(new Date());
      if (saleDate >= startYear && saleDate <= endYear) {
        yearSum.total += sale.price;
        sale.paymentMethod === 'online' ? (yearSum.online += sale.price) : (yearSum.cash += sale.price);
      }
    });

    setTodaySummary(todaySum);
    setYesterdaySummary(yesterdaySum);
    setMonthSummary(monthSum);
    setYearSummary(yearSum);
  };

  const resetSummaries = () => {
    setTodaySummary({ total: 0, online: 0, cash: 0 });
    setYesterdaySummary({ total: 0, online: 0, cash: 0 });
    setMonthSummary({ total: 0, online: 0, cash: 0 });
    setYearSummary({ total: 0, online: 0, cash: 0 });
  };

  useEffect(() => {
    let tempSales = [...sales];

    // Apply Search Filter
    if (searchTerm.trim() !== '') {
      const lowercasedTerm = searchTerm.toLowerCase();
      tempSales = tempSales.filter(
        (sale) =>
          sale.name.toLowerCase().includes(lowercasedTerm) ||
          sale.description.toLowerCase().includes(lowercasedTerm)
      );
    }

    // Apply Date Filters
    if (filter === 'today') {
      tempSales = tempSales.filter((sale) => isToday(parseISO(sale.soldAt)));
    } else if (filter === 'yesterday') {
      tempSales = tempSales.filter((sale) => isYesterday(parseISO(sale.soldAt)));
    } else if (filter === 'customDate') {
      const { start, end } = customDateRange;
      if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        tempSales = tempSales.filter((sale) => {
          const saleDate = new Date(sale.soldAt);
          return saleDate >= startDate && saleDate <= endDate;
        });
      }
    } else if (filter === 'customMonth') {
      const { month, year } = customMonth;
      if (month && year) {
        tempSales = tempSales.filter((sale) => {
          const saleDate = new Date(sale.soldAt);
          return (
            saleDate.getMonth() + 1 === parseInt(month) &&
            saleDate.getFullYear() === parseInt(year)
          );
        });
      }
    }

    setFilteredSales(tempSales);
  }, [searchTerm, filter, customDateRange, customMonth, sales]);

  const totalPrice = filteredSales.reduce((total, sale) => total + sale.price, 0);

  const handleFilterChange = (selectedFilter: FilterType) => {
    setFilter(selectedFilter);
    // Reset custom filters when changing the main filter
    if (selectedFilter !== 'customDate') {
      setCustomDateRange({ start: '', end: '' });
    }
    if (selectedFilter !== 'customMonth') {
      setCustomMonth({ month: '', year: '' });
    }
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
          <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">Loading sales...</p>
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
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 text-center">
          Sold Products
        </h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center">
            <FaCalendarDay className="text-brand-500 text-3xl mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Today</p>
              <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                ₹{todaySummary.total.toFixed(2)}
              </p>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center">
                  <FaCreditCard className="text-green-500 mr-1" /> Online: ₹{todaySummary.online.toFixed(2)}
                </span>
                <span className="flex items-center">
                  <FaMoneyCheckAlt className="text-yellow-500 mr-1" /> Cash: ₹{todaySummary.cash.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Yesterday Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center">
            <FaCalendarWeek className="text-brand-500 text-3xl mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Yesterday</p>
              <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                ₹{yesterdaySummary.total.toFixed(2)}
              </p>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center">
                  <FaCreditCard className="text-green-500 mr-1" /> Online: ₹{yesterdaySummary.online.toFixed(2)}
                </span>
                <span className="flex items-center">
                  <FaMoneyCheckAlt className="text-yellow-500 mr-1" /> Cash: ₹{yesterdaySummary.cash.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* This Month Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center">
            <FaCalendarAlt className="text-brand-500 text-3xl mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-300">This Month</p>
              <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                ₹{monthSummary.total.toFixed(2)}
              </p>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center">
                  <FaCreditCard className="text-green-500 mr-1" /> Online: ₹{monthSummary.online.toFixed(2)}
                </span>
                <span className="flex items-center">
                  <FaMoneyCheckAlt className="text-yellow-500 mr-1" /> Cash: ₹{monthSummary.cash.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* This Year Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center">
            <FaCalendar className="text-brand-500 text-3xl mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-300">This Year</p>
              <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                ₹{yearSummary.total.toFixed(2)}
              </p>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center">
                  <FaCreditCard className="text-green-500 mr-1" /> Online: ₹{yearSummary.online.toFixed(2)}
                </span>
                <span className="flex items-center">
                  <FaMoneyCheckAlt className="text-yellow-500 mr-1" /> Cash: ₹{yearSummary.cash.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* Filter Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleFilterChange('all')}
                className={`flex items-center px-4 py-2 border rounded-md text-sm font-medium ${
                  filter === 'all'
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <FaFilter className="mr-2" />
                All
              </button>
              <button
                onClick={() => handleFilterChange('today')}
                className={`flex items-center px-4 py-2 border rounded-md text-sm font-medium ${
                  filter === 'today'
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => handleFilterChange('yesterday')}
                className={`flex items-center px-4 py-2 border rounded-md text-sm font-medium ${
                  filter === 'yesterday'
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Yesterday
              </button>
              <button
                onClick={() => handleFilterChange('customDate')}
                className={`flex items-center px-4 py-2 border rounded-md text-sm font-medium ${
                  filter === 'customDate'
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Custom Date
              </button>
              <button
                onClick={() => handleFilterChange('customMonth')}
                className={`flex items-center px-4 py-2 border rounded-md text-sm font-medium ${
                  filter === 'customMonth'
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Custom Month
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative w-full max-w-md">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search sales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {filter === 'customDate' && (
            <div className="mt-4 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
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
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          )}

          {/* Custom Month Picker */}
          {filter === 'customMonth' && (
            <div className="mt-4 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
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
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Total Sales */}
        <div className="mb-4 flex justify-end">
          <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Total Sales: ₹{totalPrice.toFixed(2)}
          </div>
        </div>

        {/* Products Table */}
        {filteredSales.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400">
            No sales found.
          </div>
        ) : (
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
                  <th className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FaInfoCircle className="mr-2" />
                      Description
                    </div>
                  </th>
                  <th className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FaDollarSign className="mr-2" />
                      Price (₹)
                    </div>
                  </th>
                  <th className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FaCreditCard className="mr-2" />
                      Payment Method
                    </div>
                  </th>
                  <th className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div className="flex items-center">
                      <FaCalendarAlt className="mr-2" />
                      Sold On
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {sale.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {sale.description.length > 15
                        ? `${sale.description.substring(0, 15)}...`
                        : sale.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      ₹{sale.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {sale.paymentMethod === 'online' ? (
                        <span className="flex items-center text-green-600 dark:text-green-400">
                          <FaCreditCard className="mr-1" /> Online
                        </span>
                      ) : (
                        <span className="flex items-center text-yellow-600 dark:text-yellow-400">
                          <FaMoneyCheckAlt className="mr-1" /> Cash
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {format(new Date(sale.soldAt), 'PPP p')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Total Sales Footer */}
        {filteredSales.length > 0 && (
          <div className="mt-4 flex justify-end">
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Total Sales: ₹{totalPrice.toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SellList;
