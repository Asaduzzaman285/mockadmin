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

const Homepage = ({ sidebarVisible: propSidebarVisible }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(propSidebarVisible);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  // Track screen size changes and update sidebar visibility
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      
      // On larger screens, respect the prop value
      if (width > 768) {
        setSidebarVisible(propSidebarVisible);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial value
    
    return () => window.removeEventListener('resize', handleResize);
  }, [propSidebarVisible]);

  // Update when prop changes
  useEffect(() => {
    if (screenWidth > 992) {
      setSidebarVisible(propSidebarVisible);
    }
  }, [propSidebarVisible, screenWidth]);

  const containerStyle = {
    padding: sidebarVisible && screenWidth > 992 
      ? '80px 0% 0px 18%' 
      : screenWidth <= 768 
        ? '70px 5% 0px 5%' 
        : '70px 5% 0px 5%',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    width: '100%',
    transition: 'padding 0.3s ease-in-out'
  };

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
      </div>
    </div>
  );
};

export default Homepage;