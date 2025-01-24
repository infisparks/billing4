import React from 'react';
import {
  MdHome,
  MdOutlineShoppingCart,
  MdBarChart,
 
} from 'react-icons/md';
import { IoLogoWhatsapp } from "react-icons/io";
import { MdOutlineInventory } from "react-icons/md";
import { BiSolidAddToQueue } from "react-icons/bi";
import { MdProductionQuantityLimits } from "react-icons/md";

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
    icon: <MdProductionQuantityLimits className="h-6 w-6" />,
  },
  {
    name: 'Progress Reports',
    layout: '/admin',
    path: 'mostsell',
    icon: <MdOutlineInventory  className="h-6 w-6" />,
  }, 
  {
    name: 'Add Product',
    layout: '/admin',
    path: 'entry',
    icon: <BiSolidAddToQueue className="h-6 w-6" />,
  },
  {
    name: 'Whatsapp',
    layout: '/admin',
    path: 'whlogin',
    icon: <IoLogoWhatsapp className="h-6 w-6" />,
  },
 
];

export default routes;
