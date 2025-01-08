import React from 'react';

// Admin Imports

// Icon Imports
import {
  MdHome,
  MdOutlineShoppingCart,
  MdBarChart,
  MdPerson,
  MdLock,
} from 'react-icons/md';

const routes = [
  
  {
    name: 'Dashboard',
    layout: '/admin',
    path: 'selllist',
    icon: <MdHome className="h-6 w-6" />,
    
  },
  {
    name: 'entry',
    layout: '/admin',
    path: 'sell',
    icon: <MdOutlineShoppingCart className="h-6 w-6" />,

    secondary: true,
  },
  {
    name: 'Product List',
    layout: '/admin',
    icon: <MdBarChart className="h-6 w-6" />,
    path: 'list',
  },
  {
    name: 'ADD Product',
    layout: '/admin',
    path: 'entry',
    icon: <MdPerson className="h-6 w-6" />,
  },
  // {
  //   name: 'Sign In',
  //   layout: '/auth',
  //   path: 'sign-in',
  //   icon: <MdLock className="h-6 w-6" />,
  // },
  // {
  //   name: 'RTL Admin',
  //   layout: '/rtl',
  //   path: 'rtl-default',
  //   icon: <MdHome className="h-6 w-6" />,
  // },
];
export default routes;
