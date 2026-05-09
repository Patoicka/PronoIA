import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const Layout: React.FC = () => {
  return (
    <div id="app" className="h-full w-full overflow-auto">
      <Navbar />
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-6 space-y-6">
        <Outlet />
      </div>
    </div>
  );
};
