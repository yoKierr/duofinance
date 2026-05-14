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
      name: 'Уроки',
      path: '/learn',
      icon: '📚',
      description: 'Продолжить обучение',
    },
    {
      name: 'Достижения',
      path: '/achievements',
      icon: '🏆',
      description: 'Ваши достижения'
    },
    {
      name: 'Настройки',
      path: '/settings',
      icon: '⚙️',
      description: 'Настройки сайта'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/learn') {
      return location.pathname === '/learn' || location.pathname.startsWith('/lesson/');
    }
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
        fixed top-0 left-0 h-screen w-64 bg-zinc-950 shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:border-r lg:border-zinc-800
      `}>
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <Link to="/learn" className="flex items-center justify-center gap-3 hover:opacity-80 transition-opacity duration-200" onClick={onClose}>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">финстарт</h1>
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
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 group hover:scale-105
                    ${isActive(item.path) 
                      ? 'bg-white text-neutral-950 hover:bg-zinc-200'
                      : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className={`text-xs ${isActive(item.path) ? 'text-neutral-600' : 'text-zinc-500'}`}>
                      {item.description}
                    </p>
                  </div>
                  {isActive(item.path) && (
                    <div className="w-2 h-2 bg-neutral-950 rounded-full"></div>
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
