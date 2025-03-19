import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName'); // Retrieve the user's name

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    navigate('/login'); // Redirect to the login page
  };

  return (
    <nav className="sb-sidenav accordion sb-sidenav-dark" id="sidenavAccordion">
      <div className="sb-sidenav-menu ">
        <div className="nav">
          <NavLink className="nav-link" to="/admin/home" activeClassName="active">
            <div className="sb-nav-link-icon">
              <i className="fas fa-tachometer-alt"></i>
            </div>
            Dashboard
          </NavLink>
          <NavLink className="nav-link" to="/admin/user" activeClassName="active">
            <div className="sb-nav-link-icon">
              <i className="fas fa-tachometer-alt"></i>
            </div>
            Users
          </NavLink>
 
      
          <NavLink className="nav-link" to="/admin/tests" activeClassName="active">
            <div className="sb-nav-link-icon">
              <i className="fas fa-tachometer-alt"></i>
            </div>
            Mock Test
          </NavLink>
      
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;