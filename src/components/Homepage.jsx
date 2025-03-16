import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Breadcrumb, Spinner, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const cardData = [
  { title: 'Users', path: '/admin/user', color: '#0d6efd', icon: 'fa-solid fa-users' },
  // { title: 'Events', path: '/admin/events', color: 'rgb(51, 102, 153)', icon: 'fa-solid fa-calendar-days' },
  // { title: 'Members', path: '/admin/members', color: 'rgb(102, 153, 204)', icon: 'fa-solid fa-person' },
  // { title: 'Sliders', path: '/admin/sliders', color: 'rgb(153, 204, 255)', icon: 'fa-solid fa-sliders' },
  // { title: 'Products', path: '/admin/products', color: 'rgb(49, 84, 166)', icon: 'fa-brands fa-product-hunt' },
  // { title: 'Success Stories', path: '/admin/success_stories', color: 'rgb(108, 119, 183)', icon: 'fa-solid fa-book-medical' },
  // { title: 'Ads', path: '/admin/ads', color: 'rgb(142, 141, 193)', icon: 'fa-solid fa-rectangle-ad' },
  { title: 'Tests', path: '/admin/tests', color: '#6c757d', icon: 'fa-solid fa-file-circle-check' },
];

const InfoCard = ({ title, path, color, icon }) => {
  const navigate = useNavigate();

  return (
    <div className="col-md-4 col-lg-3 mb-4">
      <div
        className="card h-100 text-white text-center shadow-sm"
        style={{ backgroundColor: color, cursor: 'pointer', borderRadius: '0.5rem' }}
        onClick={() => navigate(path)}
      >
        <div className="card-body py-4">
          <i className={`${icon} fa-2x mb-3`}></i>
          <h5 className="card-title fw-semibold">{title}</h5>
        </div>
      </div>
    </div>
  );
};

const Homepage = ({ sidebarVisible }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  
  // Updated container style to match other pages
  const containerStyle = {
    padding: sidebarVisible ? '80px 0% 0 15%' : '80px 0% 0 0%',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    transition: 'all 0.3s ease',
  };

  useEffect(() => {
    // Simulate loading for consistency with other pages
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
      setAuthError(true);
    }
    
    return () => clearTimeout(timer);
  }, []);

  if (authError) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Alert variant="danger" className="w-50 text-center shadow-sm">
          <Alert.Heading className="fs-5">Session Expired</Alert.Heading>
          <p className="mb-3">Please login to continue</p>
          <button 
            onClick={() => navigate('/login')} 
            className="btn btn-danger px-4 py-1 rounded-pill"
          >
            Go to Login
          </button>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner 
          animation="border" 
          variant="primary" 
          style={{ width: '3rem', height: '3rem' }}
        />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div className="px-4">
        <div className="mb-3 pb-2 border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="fw-semibold text-primary mb-2 fs-4">
              <i className="fa-solid fa-gauge-high me-2"></i>
              Dashboard
            </h2>
            <Breadcrumb className="fs-7">
              <Breadcrumb.Item active>Dashboard</Breadcrumb.Item>
            </Breadcrumb>
          </div>
        </div>
        
        <div className="row">
          {cardData.map((card, index) => (
            <InfoCard key={index} title={card.title} path={card.path} color={card.color} icon={card.icon} />
          ))}
        </div>
        
        {/* <div className="copyright mt-5 text-end">
          Made with <span style={{ color: 'red' }}>❤️</span> by{' '}
          <a href="https://wintelbd.com/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#007BFF' }}>
            Wintel Limited
          </a>
        </div> */}
      </div>
    </div>
  );
};

export default Homepage;