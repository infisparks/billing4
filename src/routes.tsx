import React from 'react';
import {
  MdHome,
  MdOutlineShoppingCart,
  MdBarChart,
  MdPerson,
  MdChair,
} from 'react-icons/md';

const routes = [
  {
    name: 'Dashboard',
    layout: '/admin',
    path: 'selllist',
    icon: <MdHome className="h-6 w-6" />,
  },
  {
    name: 'Entry',
    layout: '/admin',
    path: 'sell',
    icon: <MdOutlineShoppingCart className="h-6 w-6" />,
    secondary: true,
  },
  {
    name: 'Product List',
    layout: '/admin',
    path: 'list',
    icon: <MdBarChart className="h-6 w-6" />,
  },
  {
    name: 'Inventory',
    layout: '/admin',
    path: 'inventry',
    icon: <MdChair className="h-6 w-6" />,
  },
  {
    name: 'Add Product',
    layout: '/admin',
    path: 'entry',
    icon: <MdPerson className="h-6 w-6" />,
  },
 
];

export default routes;
