import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import routes from '../../routes/routes';
import '../../assets/admin/css/styles.css';
import '../../assets/admin/css/custom.css';

const Master = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarVisible, setSidebarVisible] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      
      // Only update sidebar visibility based on screen size when it first changes
      // from mobile to desktop or vice versa, not on every resize
      if (width >= 768 && isMobile) {
        setSidebarVisible(true);
      } else if (width < 768 && !isMobile) {
        setSidebarVisible(false);
      }
    };
  
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  const handleSidebarToggle = () => {
    setSidebarVisible(prev => !prev);
  };

  return (
    <div className={`sb-nav-fixed ${!sidebarVisible ? 'sb-sidenav-toggled' : ''}`}>
      <Navbar 
        onSidebarToggle={handleSidebarToggle} 
        sidebarVisible={sidebarVisible} 
        isMobile={isMobile} 
      />
      <div id="layoutSidenav">
        {/* Conditionally render the sidebar based on visibility in mobile view */}
        <div id="layoutSidenav_nav" className={isMobile && !sidebarVisible ? 'd-none d-md-block' : ''}>
          <Sidebar />
        </div>
        <div id="layoutSidenav_content" className={sidebarVisible && isMobile ? 'content-pushed' : ''}>
          <main className="page-content">
            <Routes>
              {routes.map((route, index) => (
                <Route
                  key={index}
                  path={route.path}
                  element={<route.component sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />}
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