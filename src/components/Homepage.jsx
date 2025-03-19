import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb, Spinner, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const cardData = [
  { title: 'Users', path: '/admin/user', color: '#0d6efd', icon: 'fa-solid fa-users' },
  { title: 'Tests', path: '/admin/tests', color: '#6c757d', icon: 'fa-solid fa-file-circle-check' },
];

const InfoCard = ({ title, path, color, icon }) => {
  const navigate = useNavigate();

  return (
    <div className="col-6 col-md-4 col-lg-3 mb-3">
      <div
        className="card h-100 text-white text-center shadow-sm"
        style={{ backgroundColor: color, cursor: 'pointer', borderRadius: '0.5rem' }}
        onClick={() => navigate(path)}
      >
        <div className="card-body py-3">
          <i className={`${icon} fa-2x mb-2`}></i>
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Track screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    const token = localStorage.getItem('authToken');
    if (!token) {
      setAuthError(true);
    }

    return () => clearTimeout(timer);
  }, []);

  if (authError) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Alert variant="danger" className="w-75 text-center shadow-sm">
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

  // Set container class based on mobile and sidebar status
  const containerClass = isMobile 
    ? "page-container mobile-view" 
    : `page-container ${sidebarVisible ? "" : "expanded"}`;

  return (
    <div className={containerClass}>
      <div className="px-2 px-md-4">
        <div className="mb-3 pb-2 border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="fw-semibold text-primary mb-2 fs-5 fs-md-4">
              <i className="fa-solid fa-gauge-high me-2"></i>
              Dashboard
            </h2>
            <Breadcrumb className="fs-7 d-none d-md-flex">
              <Breadcrumb.Item active>Dashboard</Breadcrumb.Item>
            </Breadcrumb>
          </div>
        </div>
        
        <div className="row g-2">
          {cardData.map((card, index) => (
            <InfoCard key={index} title={card.title} path={card.path} color={card.color} icon={card.icon} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Homepage;