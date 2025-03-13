import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const cardData = [
  // { title: 'Users', path: '/admin/user', color: 'rgb(0, 51, 102)', icon: 'fa-solid fa-user' },
  // { title: 'Events', path: '/admin/events', color: 'rgb(51, 102, 153)', icon: 'fa-solid fa-calendar-days' },
  // { title: 'Members', path: '/admin/members', color: 'rgb(102, 153, 204)', icon: 'fa-solid fa-person' },
  // { title: 'Sliders', path: '/admin/sliders', color: 'rgb(153, 204, 255)', icon: 'fa-solid fa-sliders' },
  // { title: 'Products', path: '/admin/products', color: 'rgb(49, 84, 166)', icon: 'fa-brands fa-product-hunt' },
  // { title: 'Success Stories', path: '/admin/success_stories', color: 'rgb(108, 119, 183)', icon: 'fa-solid fa-book-medical' },
  // { title: 'Ads', path: '/admin/ads', color: 'rgb(142, 141, 193)', icon: 'fa-solid fa-rectangle-ad' },
  { title: 'MockTest', path: 'admin/mocktest', color: 'rgb(174, 156, 167)', icon: 'fa-brands fa-first-order' },
];

const InfoCard = ({ title, path, color, icon }) => {
  const navigate = useNavigate();

  return (
    <div className="col-md-3 mb-4">
      <div
        className="card h-100 text-white text-center"
        style={{ backgroundColor: color, cursor: 'pointer' }}
        onClick={() => navigate(path)}
      >
        <div className="card-body">
          <i className={`${icon} fa-2x mb-3`}></i>
          <h5 className="card-title">{title}</h5>
        </div>
      </div>
    </div>
  );
};

const Homepage = ({ sidebarVisible }) => {
  const containerStyle = sidebarVisible
    ? { padding: '60px 1% 0 17%', backgroundColor: 'aliceblue', overflowX: 'hidden', minHeight: '100vh', maxWidth: '99vw' }
    : { padding: '60px 0 0 30px', backgroundColor: 'aliceblue', overflowX: 'hidden', minHeight: '100vh', minWidth: '100vw' };

  return (
    <div className="container mt-4" style={containerStyle}>
      <h1 className="mb-4">Dashboard</h1>
      <div className="row">
        {cardData.map((card, index) => (
          <InfoCard key={index} title={card.title} path={card.path} color={card.color} icon={card.icon} />
        ))}
      </div>
      <div className="copyright mt-5 text-end">
        Made with <span style={{ color: 'red' }}>❤️</span> by{' '}
        <a href="https://wintelbd.com/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#007BFF' }}>
          Wintel Limited
        </a>
      </div>
    </div>
  );
};

export default Homepage;