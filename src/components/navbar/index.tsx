'use client';
import React, { useEffect, useState, useRef } from 'react';
import Dropdown from 'components/dropdown';
import { FiAlignJustify, FiSearch } from 'react-icons/fi';
import NavLink from 'components/link/NavLink';
import navbarimage from '/public/img/layout/Navbar.png';
import { BsArrowBarUp } from 'react-icons/bs';
import { RiMoonFill, RiSunFill } from 'react-icons/ri';
import {
  IoMdNotificationsOutline,
  IoMdInformationCircleOutline,
} from 'react-icons/io';
import avatar from '/public/img/avatars/avatar4.png';
import Image from 'next/image';
import { database } from '../../../firebase/firebaseConfig';
import { ref, query, orderByChild, startAt, endAt, onValue } from 'firebase/database';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  createdAt: string;
}

const Navbar = (props: {
  onOpenSidenav: () => void;
  brandText: string;
  secondary?: boolean | string;
  [x: string]: any;
}) => {
  const { onOpenSidenav, brandText, mini, hovered } = props;
  const [darkmode, setDarkmode] = React.useState(
    typeof window !== 'undefined' ? document.body.classList.contains('dark') : false
  );

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce mechanism
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim() !== '') {
        fetchSearchResults(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Fetch search results from Firebase
  const fetchSearchResults = (term: string) => {
    const productsRef = ref(database, 'products');
    const searchQuery = query(
      productsRef,
      orderByChild('name'),
      startAt(term),
      endAt(term + '\uf8ff')
    );

    onValue(
      searchQuery,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const productsList: Product[] = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));

          // Case-insensitive search: filter products
          const filteredProducts = productsList.filter((product) =>
            product.name.toLowerCase().includes(term.toLowerCase())
          );
          setSearchResults(filteredProducts);
        } else {
          setSearchResults([]);
        }
      },
      (error) => {
        console.error('Error fetching search results:', error);
        setSearchResults([]);
      }
    );
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="sticky top-4 z-40 flex flex-row flex-wrap items-center justify-between rounded-xl bg-white/10 p-2 backdrop-blur-xl dark:bg-[#0b14374d]">
      <div className="ml-[6px]">
        <div className="h-6 w-[224px] pt-1">
          <a
            className="text-sm font-normal text-navy-700 hover:underline dark:text-white dark:hover:text-white"
            href="#"
          >
            Pages
            <span className="mx-1 text-sm text-navy-700 hover:text-navy-700 dark:text-white">
              {' '}
              /{' '}
            </span>
          </a>
          <NavLink
            className="text-sm font-normal capitalize text-navy-700 hover:underline dark:text-white dark:hover:text-white"
            href="#"
          >
            {brandText}
          </NavLink>
        </div>
        <p className="shrink text-[33px] capitalize text-navy-700 dark:text-white">
          <NavLink
            href="#"
            className="font-bold capitalize hover:text-navy-700 dark:hover:text-white"
          >
            {brandText}
          </NavLink>
        </p>
      </div>

      <div className="relative mt-[3px] flex h-[61px] w-[355px] flex-grow items-center justify-around gap-2 rounded-full bg-white px-2 py-2 shadow-xl shadow-shadow-500 dark:!bg-navy-800 dark:shadow-none md:w-[365px] md:flex-grow-0 md:gap-1 xl:w-[365px] xl:gap-2">
        {/* Search Bar with Dropdown */}
        <div className="relative w-full max-w-md" ref={dropdownRef}>
          <div className="flex items-center bg-lightPrimary dark:bg-navy-900 rounded-full px-3 py-2">
            <FiSearch className="text-gray-400 dark:text-white  mr-2" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => {
                if (searchTerm.trim() !== '') setShowDropdown(true);
              }}
              className="w-full bg-transparent outline-none text-gray-700 dark:bg-[#0B1437]  placeholder-gray-400 dark:text-white dark:placeholder-gray-300"
            />
          </div>

          {/* Dropdown List */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white dark:bg-navy-800 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {searchResults.map((product) => (
                <a
                  key={product.id}
                  href="#"
                  className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-navy-700"
                  onClick={() => {
                    // Handle product selection (e.g., navigate to product page)
                    // For now, we'll just close the dropdown and set the search term
                    setShowDropdown(false);
                    setSearchTerm(product.name);
                  }}
                >
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-300">
                      ₹{product.price.toFixed(2)}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* No Results Found */}
          {showDropdown && searchResults.length === 0 && searchTerm.trim() !== '' && (
            <div className="absolute top-full mt-2 w-full bg-white dark:bg-navy-800 rounded-lg shadow-lg z-50 p-4 text-gray-500 dark:text-gray-300">
              No products found.
            </div>
          )}
        </div>

        <span
          className="flex cursor-pointer text-xl text-gray-600 dark:text-white xl:hidden"
          onClick={onOpenSidenav}
        >
          <FiAlignJustify className="h-5 w-5" />
        </span>

        {/* Notifications Dropdown */}
        <Dropdown
          button={
            <p className="cursor-pointer">
              <IoMdNotificationsOutline className="h-4 w-4 text-gray-600 dark:text-white" />
            </p>
          }
          animation="origin-[65%_0%] md:origin-top-right transition-all duration-300 ease-in-out"
          classNames={'py-2 top-4 -left-[230px] md:-left-[440px] w-max'}
        >
          <div className="flex w-[360px] flex-col gap-3 rounded-[20px] bg-white p-4 shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white dark:shadow-none sm:w-[460px]">
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-navy-700 dark:text-white">
                Notification
              </p>
              <p className="text-sm font-bold text-navy-700 dark:text-white">
                Mark all read
              </p>
            </div>
          </div>
        </Dropdown>

        {/* Information Dropdown (Updated with INFISPARK details) */}
        <Dropdown
          button={
            <p className="cursor-pointer">
              <IoMdInformationCircleOutline className="h-4 w-4 text-gray-600 dark:text-white" />
            </p>
          }
          classNames={'py-2 top-6 -left-[250px] md:-left-[330px] w-max'}
          animation="origin-[75%_0%] md:origin-top-right transition-all duration-300 ease-in-out"
        >
          <div className="flex w-[350px] flex-col gap-2 rounded-[20px] bg-white p-4 shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white dark:shadow-none">
            <div className="mb-2 aspect-video w-full rounded-lg bg-cover bg-no-repeat">
              {/* Custom Company Image */}
              <p className="text-lg text-navy-700 dark:text-white">
                INFISPARK: Custom Software & Web Development
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-300">
                We specialize in creating customized software solutions and web development to meet your unique business needs.
              </p>
            </div>
          </div>
        </Dropdown>

        {/* Dark Mode Toggle */}
        <div
          className="cursor-pointer text-gray-600"
          onClick={() => {
            if (darkmode) {
              document.body.classList.remove('dark');
              setDarkmode(false);
            } else {
              document.body.classList.add('dark');
              setDarkmode(true);
            }
          }}
        >
          {darkmode ? (
            <RiSunFill className="h-4 w-4 text-gray-600 dark:text-white" />
          ) : (
            <RiMoonFill className="h-4 w-4 text-gray-600 dark:text-white" />
          )}
        </div>

        {/* Profile Dropdown */}
        <Dropdown
          button={
            <Image
              width="40"
              height="40"
              className="h-10 w-10 rounded-full"
              src={avatar}
              alt="User Avatar"
            />
          }
          classNames={'py-2 top-8 -left-[180px] w-max'}
        >
          <div className="flex h-48 w-56 flex-col justify-start rounded-[20px] bg-white bg-cover bg-no-repeat shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white dark:shadow-none">
            <div className="ml-4 mt-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  👋 Hey, User
                </p>
              </div>
            </div>
            <div className="mt-3 h-px w-full bg-gray-200 dark:bg-white/20 " />

            <div className="ml-4 mt-3 flex flex-col">
              <a
                href="#"
                className="text-sm text-gray-800 dark:text-white hover:dark:text-white"
              >
                Profile Settings
              </a>
              <a
                href="#"
                className="mt-3 text-sm text-gray-800 dark:text-white hover:dark:text-white"
              >
                Newsletter Settings
              </a>
              <a
                href="#"
                className="mt-3 text-sm font-medium text-red-500 hover:text-red-500"
              >
                Log Out
              </a>
            </div>
          </div>
        </Dropdown>
      </div>
    </nav>
  );
};

export default Navbar;
