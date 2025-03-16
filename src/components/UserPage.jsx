import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Breadcrumb, Spinner, Alert } from "react-bootstrap";
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import axios from 'axios';
import Paginate from './Paginate';

// Base URL configuration
const API_BASE_URL = "https://mocktestadminapi.lyricistsassociationbd.com";

// Custom styles for Select component
const customSelectStyles = {
  control: (base) => ({
    ...base,
    minHeight: '36px',
    height: '36px',
    borderRadius: '18px',
    borderColor: '#dee2e6',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#6c757d'
    }
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '0 8px',
    height: '36px'
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: '36px'
  }),
  placeholder: (base) => ({
    ...base,
    color: '#adb5bd',
    fontSize: '0.9rem'
  }),
  singleValue: (base) => ({
    ...base,
    fontSize: '0.9rem'
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#0d6efd' : state.isFocused ? '#e9ecef' : null,
    fontSize: '0.9rem',
    padding: '8px 12px'
  })
};

// Modal Component
const UserModal = ({ show, handleClose, handleSubmit, modalData, setModalData, isEditing, roles }) => {
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setLoading(true); // Disable button and show "Processing..."
    
    setTimeout(() => {
      handleSubmit(e);
      setLoading(false); // Enable button after delay
    }, 2500); // 2.5 seconds delay
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>{isEditing ? "Update User" : "Create New User"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleFormSubmit}>
          <Form.Group className="mb-3" controlId="formName">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter name"
              value={modalData.name}
              onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={modalData.email}
              onChange={(e) => setModalData({ ...modalData, email: e.target.value })}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formRole">
            <Form.Label>Role</Form.Label>
            <Form.Control
              as="select"
              value={modalData.role_ids[0] || ""}
              onChange={(e) => setModalData({ ...modalData, role_ids: [e.target.value] })}
              required
            >
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </Form.Control>
          </Form.Group>
          <Form.Group className="mb-3" controlId="formStatus">
            <Form.Label>Status</Form.Label>
            <Form.Control
              as="select"
              value={modalData.status}
              onChange={(e) => setModalData({ ...modalData, status: e.target.value })}
              required
            >
              <option value="">Select status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </Form.Control>
          </Form.Group>
          {!isEditing && (
            <Form.Group className="mb-3" controlId="formPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={modalData.password}
                onChange={(e) => setModalData({ ...modalData, password: e.target.value })}
                required
              />
            </Form.Group>
          )}
          <div className="d-flex justify-content-end mt-4">
            <Button variant="secondary" onClick={handleClose} className="me-2">
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading}
              className="px-4"
            >
              {loading ? "Processing..." : isEditing ? "Update" : "Add"} User
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

// Main UserPage Component
const UserPage = ({ sidebarVisible }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(5);
  const [paginator, setPaginator] = useState({
    current_page: 1,
    total_pages: 1,
    previous_page_url: null,
    next_page_url: null,
    record_per_page: 5,
    current_page_items_count: 0,
    total_count: 0,
    pagination_last_page: 1
  });
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    name: "",
    email: "",
    role_ids: [],
    status: "",
    password: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [visibleUpdateButtons, setVisibleUpdateButtons] = useState({});
  const [isFiltered, setIsFiltered] = useState(false);
  const [nameOptions, setNameOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);

  // Fetch filter options (name list with emails)
  const getFilterOptions = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No authentication token found');
      setAuthError(true);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/user-filter-data`, {}, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.data?.status === "success" && response.data?.data?.name_list) {
        setNameOptions(response.data.data.name_list);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
      if (error.response && error.response.status === 401) {
        setAuthError(true);
      }
      setLoading(false);
    }
  };

  const getUsersData = (page = 1, userId = null) => {
    setTableLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No authentication token found');
      setAuthError(true);
      setTableLoading(false);
      setLoading(false);
      return;
    }

    let url;
    let requestBody = {};
    
    if (userId) {
      url = `${API_BASE_URL}/api/v1/getAllUsers_p?page=${page}`;
      requestBody = { user_id: userId };
    } else {
      url = `${API_BASE_URL}/api/v1/getAllUsers_p?page=${page}`;
    }

    axios.post(url, requestBody, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    })
    .then((response) => {
      console.log("API Response:", response.data);
      if (response.data?.status === "success" && response.data?.data?.data) {
        setFilteredUsers(response.data.data.data);
        if (response.data?.data?.paginator) {
          setPaginator(response.data.data.paginator);
        }
      } else {
        console.warn("Unexpected API response format:", response.data);
        setFilteredUsers([]);
      }
      setTableLoading(false);
      setLoading(false);
    })
    .catch((error) => {
      console.error('Error fetching users:', error);
      if (error.response && error.response.status === 401) {
        setAuthError(true);
      }
      setFilteredUsers([]);
      setTableLoading(false);
      setLoading(false);
    });
  };

  const getRolesData = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No authentication token found");
      setAuthError(true);
      setLoading(false);
      return;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/role/getAllRoles`, {}, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.data.status === "success" && response.data.data && response.data.data.rolelist) {
        setRoles(response.data.data.rolelist);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      if (error.response && error.response.status === 401) {
        setAuthError(true);
      }
      setLoading(false);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        getFilterOptions(),
        getUsersData(currentPage),
        getRolesData()
      ]);
    };
    
    initializeData();
  }, []);

  // Handle page change
  useEffect(() => {
    if (!loading) {
      getUsersData(currentPage, selectedUser?.value);
    }
  }, [currentPage]);

  const handleFilterChange = (selectedOption) => {
    setSelectedUser(selectedOption);
  };

  const handleFilter = () => {
    setTableLoading(true);
    setCurrentPage(1);
    if (selectedUser) {
      setIsFiltered(true);
      getUsersData(1, selectedUser.value);
    } else {
      setIsFiltered(false);
      getUsersData(1);
    }
  };

  const handleClearFilter = () => {
    setSelectedUser(null);
    setIsFiltered(false);
    setCurrentPage(1);
    getUsersData(1);
  };

  const toggleUpdateButton = (userId) => {
    setVisibleUpdateButtons((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const renderUserRows = () => {
    if (tableLoading) {
      return (
        <tr>
          <td colSpan="6" className="text-center py-4">
            <div className="d-flex justify-content-center align-items-center">
              <Spinner animation="border" variant="primary" />
              <span className="ms-3 text-muted">Loading users...</span>
            </div>
          </td>
        </tr>
      );
    }
    
    if (!Array.isArray(filteredUsers) || filteredUsers.length === 0) {
      return (
        <tr>
          <td colSpan="6" className="text-center py-4">
            <i className="fa-solid fa-user-slash me-2"></i> No users found
          </td>
        </tr>
      );
    }
    
    return filteredUsers.map((user, index) => {
      const roleNames = user.roles?.map(role => role.name).join(', ') || 'No Role';
      return (
        <tr key={user.id} className="align-middle">
          <td className="ps-4">{isFiltered ? user.id : ((paginator.current_page - 1) * paginator.record_per_page) + index + 1}</td>
          <td>
            <div className="d-flex align-items-center">
              <div className="bg-light rounded-circle p-2 me-2 text-center" style={{ width: '40px', height: '40px' }}>
                <i className="fa-solid fa-user"></i>
              </div>
              <div>
                <div className="fw-bold">{user.name}</div>
                <div className="small text-muted">{user.email}</div>
              </div>
            </div>
          </td>
          <td>
            <span className="badge bg-info text-dark px-3 py-2">{roleNames}</span>
          </td>
          <td>
            {user.status === 1 ? (
              <span className="bg-success badge text-white px-3 py-2">Active</span>
            ) : (
              <span className="bg-warning badge text-dark px-3 py-2">Inactive</span>
            )}
          </td>
          <td>{user.email}</td>
          <td className="text-center">
            <Button 
              variant="outline-primary" 
              size="sm"
              className="rounded-circle" 
              style={{ width: '36px', height: '36px' }}
              onClick={() => handleEdit(user)}
            >
              <i className="fa-solid fa-pen-to-square"></i>
            </Button>
          </td>
        </tr>
      );
    });
  };

  const handleAdd = () => {
    setModalData({
      name: "",
      email: "",
      role_ids: [],
      status: "",
      password: ""
    });
    setIsEditing(false);
    setEditingUserId(null);
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setModalData({
      ...user,
      role_ids: user.roles?.map(role => role.id) || [],
      password: ""
    });
    setIsEditing(true);
    setEditingUserId(user.id);
    setShowModal(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No authentication token found');
      setAuthError(true);
      return;
    }
    
    const { id, name, email, role_ids, status, password } = modalData;
  
    try {
      if (isEditing) {
        const response = await axios.post(`${API_BASE_URL}/api/v1/updateUser`, {
          id,
          name,
          email,
          role_ids,
          status
        }, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
          
        if (response.data?.status === "success") {
          // Refresh data after successful update
          if (isFiltered && selectedUser) {
            getUsersData(currentPage, selectedUser.value);
          } else {
            getUsersData(currentPage);
          }
          getFilterOptions(); // Refresh the filter options
        }
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/v1/createUser`, {
          name,
          email,
          role_ids,
          status,
          password
        }, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (response.data?.status === "success") {
          getUsersData(1);
          getFilterOptions(); // Refresh the filter options
          setCurrentPage(1);
        }
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} user:`, error);
      if (error.response && error.response.status === 401) {
        setAuthError(true);
      }
    }
  
    handleClose();
  };
  
  const handleClose = () => {
    setShowModal(false);
    if (editingUserId !== null) {
      setVisibleUpdateButtons((prev) => ({
        ...prev,
        [editingUserId]: false,
      }));
    }
  };
  
  // Updated container style to match Tests page
  const containerStyle = {
    padding: sidebarVisible ? '80px 0% 0 15%' : '80px 0% 0 0%',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    transition: 'all 0.3s ease',
  };
  
  // Redirect to login if authentication error
  useEffect(() => {
    if (authError) {
      navigate('/login');
    }
  }, [authError, navigate]);
  
  // Check for loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div style={containerStyle}>
      <div className="px-4">
        {/* Updated header section styling */}
        <div className="mb-3 pb-2 border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="fw-semibold text-primary mb-2 fs-4">
              <i className="fa-solid fa-users me-2"></i>
              User Management
            </h2>
            <Breadcrumb className="fs-7">
              <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Dashboard</Breadcrumb.Item>
              <Breadcrumb.Item active>Users</Breadcrumb.Item>
            </Breadcrumb>
          </div>
  
          {/* Updated filter section styling */}
          <div className="d-flex flex-wrap gap-3">
            <div className="d-flex align-items-center" style={{ minWidth: '280px' }}>
              <div style={{ flex: 1 }}>
                <Select
                  options={nameOptions}
                  value={selectedUser}
                  onChange={handleFilterChange}
                  placeholder="Search by name/email..."
                  isClearable
                  styles={customSelectStyles}
                  className="select2-container"
                />
              </div>
              <div className="ms-2 d-flex">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="rounded-circle p-1 d-flex align-items-center justify-content-center"
                  style={{ width: '30px', height: '30px' }}
                  title="Filter"
                  onClick={handleFilter}
                >
                  <i className="fa-solid fa-filter"></i>
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="rounded-circle p-1 d-flex align-items-center justify-content-center ms-1"
                  style={{ width: '30px', height: '30px' }}
                  title="Clear filter"
                  onClick={handleClearFilter}
                  disabled={!selectedUser}
                >
                  <i className="fa-solid fa-xmark"></i>
                </Button>
              </div>
            </div>
          </div>
  
          {/* Updated Add button styling */}
          <div className="mt-3">
            <Button
              variant="primary"
              onClick={handleAdd}
              className="rounded-pill px-3 btn-sm py-1 d-flex align-items-center gap-1 shadow-sm fs-7"
            >
              <i className="fa-solid fa-plus"></i>
              <span>Add new</span>
            </Button>
          </div>
        </div>
  
        {/* Updated table container styling */}
        <div className="bg-white rounded-3 shadow-sm overflow-hidden">
          {tableLoading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <div className="spinner-border text-primary me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <span className="ms-3 text-muted">Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="alert alert-info m-3 rounded-3 shadow-sm">
              <i className="fa-solid fa-info-circle me-2"></i>
              {selectedUser ? "No users match your filter. Please try another selection." : "No users found. Add your first user to get started."}
            </div>
          ) : (
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4 text-secondary small">#</th>
                  <th className="text-secondary small">USER INFORMATION</th>
                  <th className="text-secondary small">ROLE</th>
                  <th className="text-secondary small">STATUS</th>
                  <th className="text-secondary small">EMAIL</th>
                  <th className="text-center text-secondary small">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {renderUserRows()}
              </tbody>
            </table>
          )}
        </div>
  
        {/* Updated pagination styling */}
        {!isFiltered && !tableLoading && filteredUsers.length > 0 && (
          <div className="mt-4 d-flex justify-content-end">
            <Paginate
              paginator={paginator}
              currentPage={currentPage}
              pagechanged={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>
      
      <UserModal
        show={showModal}
        handleClose={handleClose}
        handleSubmit={handleModalSubmit}
        modalData={modalData}
        setModalData={setModalData}
        isEditing={isEditing}
        roles={roles}
      />
    </div>
  );
  };
  
  export default UserPage;