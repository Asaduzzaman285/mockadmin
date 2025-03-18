import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import routes from '../../routes/routes';
import '../../assets/admin/css/styles.css';
import '../../assets/admin/js/scripts.js';

const Master = () => {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 992;
      setIsMobile(mobile);
      // Only auto-hide on mobile, don't override user toggle
      if (mobile && sidebarVisible) {
        setSidebarVisible(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarVisible]);

  const handleSidebarToggle = () => {
    setSidebarVisible(prev => !prev);
  };

  return (
    <div className={`sb-nav-fixed ${!sidebarVisible ? 'sb-sidenav-toggled' : ''}`}>
      <Navbar onSidebarToggle={handleSidebarToggle} isMobile={isMobile} />
      <div id="layoutSidenav">
        <div id="layoutSidenav_nav" 
          className={`${isMobile ? 'mobile-nav' : ''} ${sidebarVisible ? '' : 'd-none'}`}
        >
          <Sidebar />
        </div> 
        <div className="layoutSidenav_content">
          <main>
            <Routes>
              {routes.map((route, index) => (
                <Route
                  key={index}
                  path={route.path}
                  element={<route.component sidebarVisible={sidebarVisible} />}
                />
              ))}
              <Route path="*" element={<Navigate to="/admin/home" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Master;