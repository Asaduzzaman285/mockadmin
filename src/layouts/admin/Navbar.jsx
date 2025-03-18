import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ onSidebarToggle, sidebarVisible }) => {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName");

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userName");
    navigate("/login");
  };

  return (
    <nav className="sb-topnav navbar navbar-expand navbar-dark bg-dark">
      <Link className="navbar-brand fs-5 ps-3" to="/index.html">
        Mock Test
      </Link>
      
      <button
        className="btn btn-link btn-sm order-1 order-lg-0 me-4 me-lg-0"
        id="sidebarToggle"
        onClick={onSidebarToggle}
      >
        <i className="fas fa-bars"></i>
      </button>
      
      <form className="d-none d-md-inline-block form-inline ms-auto me-0 me-md-3 my-2 my-md-0"></form>
      
      <ul className="navbar-nav ms-auto ms-md-0 me-3 me-lg-4">
        <li className="nav-item dropdown">
          <Link
            className="nav-link dropdown-toggle"
            id="navbarDropdown"
            to="#"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="fas fa-user fa-fw"></i> {userName}
          </Link>
          <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <button onClick={handleLogout} className="dropdown-item">
                Logout
              </button>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;