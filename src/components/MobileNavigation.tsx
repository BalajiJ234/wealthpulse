"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  DollarSign,
  PiggyBank,
  Settings,
  Menu,
  X,
  LayoutDashboard,
} from "lucide-react";
import Logo from "./Logo";

// Navigation items
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: DollarSign },
  { href: "/planning", label: "Budget", icon: PiggyBank },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Bottom tab items for mobile (main items only)
const bottomTabItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: DollarSign },
  { href: "/planning", label: "Budget", icon: PiggyBank },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function MobileNavigation() {
  const pathname = usePathname();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  return (
    <>
      {/* Desktop/Tablet Top Navigation */}
      <nav className='md:block bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-800'>
        <div className='container mx-auto px-4'>
          <div className='flex items-center justify-between h-16'>
            {/* Logo */}
            <Logo size='md' showText={true} animated={true} />

            {/* Desktop Navigation Links */}
            <div className='hidden md:flex space-x-6'>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        : "text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}>
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile menu button */}
            <div className='md:hidden'>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className='text-gray-600 dark:text-gray-300 hover:text-blue-600 p-2'>
                {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Slide-out Menu */}
        {showMobileMenu && (
          <>
            {/* Overlay */}
            <div
              className='fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden'
              onClick={() => setShowMobileMenu(false)}
            />

            {/* Slide-out Menu */}
            <div className='fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl z-50 md:hidden transform transition-transform duration-300 ease-in-out'>
              <div className='p-6'>
                <div className='flex justify-between items-center mb-8'>
                  <h2 className='text-xl font-bold text-gray-900 dark:text-white'>
                    Menu
                  </h2>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'>
                    <X size={24} />
                  </button>
                </div>

                <div className='space-y-2'>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                          isActive
                            ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                            : "text-gray-600 dark:text-gray-300 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                        onClick={() => setShowMobileMenu(false)}>
                        <Icon size={22} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Mobile Bottom Tab Bar */}
      {isMobile && (
        <div className='fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-30 md:hidden safe-area-pb'>
          <div className='flex items-center justify-around py-2'>
            {bottomTabItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center py-2 px-3 min-w-0 flex-1 text-center transition-colors ${
                    isActive
                      ? "text-blue-600"
                      : "text-gray-400 dark:text-gray-500"
                  }`}>
                  <Icon size={20} className='mb-1' />
                  <span className='text-xs font-medium truncate'>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
