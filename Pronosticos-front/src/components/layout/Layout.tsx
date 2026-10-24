import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const Layout: React.FC = () => {
  return (
    <div id="app" className="h-full w-full overflow-x-hidden overflow-y-auto">
      <Navbar />
      <div className="page-shell">
        <Outlet />
      </div>
    </div>
  );
};
