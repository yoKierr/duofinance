import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    {
      name: 'Learn',
      path: '/learn',
      icon: '📚',
      description: 'Continue learning'
    },
    {
      name: 'Achievements',
      path: '/achievements',
      icon: '🏆',
      description: 'Your achievements'
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: '⚙️',
      description: 'App settings'
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Overlay для мобильных устройств */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-screen w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:border-r lg:border-gray-200
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <Link to="/learn" className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200" onClick={onClose}>
            <img 
              src="/logo-removebg-preview.png" 
              alt="DuoFinance" 
              className="w-10 h-10 hover:scale-105 transition-transform duration-200"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-800">duofinance</h1>
            </div>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group hover:scale-105 hover:shadow-lg
                    ${isActive(item.path) 
                      ? 'bg-[#00e3c1] text-white shadow-md hover:bg-[#00d4b3]' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-md'
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className={`text-xs ${isActive(item.path) ? 'text-white/80' : 'text-gray-500'}`}>
                      {item.description}
                    </p>
                  </div>
                  {isActive(item.path) && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
