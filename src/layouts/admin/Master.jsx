import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import routes from '../../routes/routes';
import '../../assets/admin/css/styles.css';
const Master = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992); // Initialize isMobile first
  const [sidebarVisible, setSidebarVisible] = useState(!isMobile); // Use isMobile to set initial sidebarVisible

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 992;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarVisible(false); // Ensure sidebar is hidden by default on mobile
      } else {
        setSidebarVisible(true); // Show sidebar by default on larger screens
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSidebarToggle = () => {
    setSidebarVisible(prev => !prev);
  };

  return (
    <div className={`sb-nav-fixed ${!sidebarVisible ? 'sb-sidenav-toggled' : ''}`}>
      <Navbar onSidebarToggle={handleSidebarToggle} isMobile={isMobile} />
      <div id="layoutSidenav">
        <div 
          id="layoutSidenav_nav" 
          className={`${isMobile ? 'mobile-nav' : ''} ${!sidebarVisible && 'hidden-sidebar'}`}
        >
          <Sidebar />
        </div>
        <div className="layoutSidenav_content">
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
// const Master = () => {
//   const [sidebarVisible, setSidebarVisible] = useState(!isMobile); // Default to false for smaller screens
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);

//   useEffect(() => {
//     const handleResize = () => {
//       const mobile = window.innerWidth <= 992;
//       setIsMobile(mobile);
//       if (mobile) {
//         setSidebarVisible(false); // Ensure sidebar is hidden by default on mobile
//       }
//     };

//     window.addEventListener('resize', handleResize);
//     handleResize();
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   const handleSidebarToggle = () => {
//     setSidebarVisible(prev => !prev);
//   };

//   return (
//     <div className={`sb-nav-fixed ${!sidebarVisible ? 'sb-sidenav-toggled' : ''}`}>
//       <Navbar onSidebarToggle={handleSidebarToggle} isMobile={isMobile} />
//       <div id="layoutSidenav">
//         <div 
//           id="layoutSidenav_nav" 
//           className={`${isMobile ? 'mobile-nav' : ''} ${!sidebarVisible && 'hidden-sidebar'}`}
//         >
//           <Sidebar />
//         </div>
//         <div className="layoutSidenav_content">
//           <main>
//             <Routes>
//               {routes.map((route, index) => (
//                 <Route
//                   key={index}
//                   path={route.path}
//                   element={<route.component sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />}
//                 />
//               ))}
//               <Route path="*" element={<Navigate to="/admin/home" />} />
//             </Routes>
//           </main>
//           <Footer />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Master;