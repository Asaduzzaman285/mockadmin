import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Dropdown } from "react-bootstrap";
import Select from 'react-select';
import axios from 'axios';
import Paginate from './Paginate';

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
      <Modal.Header closeButton>
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
          <Form.Group className="mb-3" controlId="formPhone">
            <Form.Label>Phone</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter phone"
              value={modalData.phone}
              onChange={(e) => setModalData({ ...modalData, phone: e.target.value })}
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
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? "Processing..." : isEditing ? "Update" : "Add"} User
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );

};

// Main UserPage Component
const UserPage = ({ sidebarVisible }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
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
    phone: "",
    role_ids: [],
    status: "",
    password: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [visibleUpdateButtons, setVisibleUpdateButtons] = useState({});
  const [isFiltered, setIsFiltered] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState([]);

  const getAllUsersData = () => {
    console.log('Fetching all users...');

    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('No authentication token found');
        return;
    }

    axios.post('https://adminapi.lyricistsassociationbd.com/api/v1/getAllUsers', {}, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    })
    .then((response) => {
    
        if (!response.data) {
            console.error('Response data is undefined');
            return;
        }

        console.log('Response data:', response.data);

        if (!response.data.data) {
            console.error('Missing `data` inside response');
            return;
        }

        const allUsers = response.data.data; // Adjusted to match the actual response structure
        console.log('Extracted all users:', allUsers);

        if (!Array.isArray(allUsers) || allUsers.length === 0) {
            console.warn('No users found in API response');
            return;
        }

        setUsers(allUsers);
        console.log('Users state updated');

        const options = allUsers.map(user => ({
            value: user.id,
            label: user.name
        }));

        console.log('Generated dropdown options:', options);

        setDropdownOptions(options);
        console.log('Dropdown options state updated');

    })
    .catch((error) => {
        console.error('Error fetching all users:', error);
        if (error.response) {
            console.error('Server responded with:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('No response received from server:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
    });
};

  const getUsersData = (page = 1) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    axios.post(`https://adminapi.lyricistsassociationbd.com/api/v1/getAllUsers_p?page=${page}`, {}, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    })
    .then((response) => {
      if (response.data?.data?.data && response.data?.data?.paginator) {
        setFilteredUsers(response.data.data.data);
        setPaginator(response.data.data.paginator);
      }
    })
    .catch((error) => {
      console.error('Error fetching users:', error);
    });
  };

  const getRolesData = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No authentication token found");
      return;
    }
    try {
      const response = await axios.post('https://adminapi.lyricistsassociationbd.com/api/v1/role/getAllRoles', {}, {
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
    }
  };

  useEffect(() => {
    getAllUsersData();
    getUsersData(currentPage);
    getRolesData();
  }, [currentPage]);

  const handleFilterChange = (selectedOption) => {
    setSelectedUser(selectedOption);
  };

  const handleRoleFilterChange = (selectedOption) => {
    setSelectedRole(selectedOption);
  };

  const handleStatusFilterChange = (selectedOption) => {
    setSelectedStatus(selectedOption);
  };
  const handleFilter = async () => {
    const token = localStorage.getItem('authToken');
    let filtered = users;

    if (selectedUser) {
      try {
        const response = await axios.post('https://adminapi.lyricistsassociationbd.com/api/v1/getUser', 
          { id: selectedUser.value },
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            }
          }
        );
        if (response.data?.data) {
          filtered = [response.data.data];
        }
      } catch (error) {
        console.error('Error fetching single user:', error);
      }
    }

    if (selectedRole) {
      filtered = filtered.filter(user => user.roles.some(role => role.id === selectedRole.value));
    }

    if (selectedStatus) {
      filtered = filtered.filter(user => user.status === selectedStatus.value);
    }

    setFilteredUsers(filtered);
    setIsFiltered(true);
  };

  const handleClearFilter = () => {
    setSelectedUser(null);
    setSelectedRole(null);
    setSelectedStatus(null);
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
    if (!Array.isArray(filteredUsers) || filteredUsers.length === 0) {
      return <tr><td colSpan="7">No users found</td></tr>;
    }
    return filteredUsers.map((user, index) => {
      const roleNames = user.roles?.map(role => role.name).join(', ') || 'No Role';
      return (
        <tr key={user.id}>
          <td>{isFiltered ? user.id : ((paginator.current_page - 1) * paginator.record_per_page) + index + 1}</td>
          <td>{user.name}</td>
          <td>{user.phone}</td>
          <td>{roleNames}</td>
          <td>
  {user.status === 1 ? (
    <span className="bg-success badge text-white px-2">Active</span>
  ) : (
    <span className="bg-warning badge text-dark px-2">Inactive</span>
  )}
</td>    <td>{user.email}</td>
          <td className="text-center">
            <Button variant="link" onClick={() => handleEdit(user)}>
              <i className="fa-solid fa-pen-to-square text-dark"></i>
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
      phone: "",
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
    const { id, name, email, phone, role_ids, status, password } = modalData;

    if (isEditing) {
      try {
        await axios.post('https://adminapi.lyricistsassociationbd.com/api/v1/updateUser', {
          id,
          name,
          email,
          phone,
          role_ids,
          status
        }, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (isFiltered) {
          handleFilter();
        } else {
          getUsersData(currentPage);
        }
        getAllUsersData();
      } catch (error) {
        console.error('Error updating user:', error);
      }
    } else {
      try {
        await axios.post('https://adminapi.lyricistsassociationbd.com/api/v1/createUser', {
          name,
          email,
          phone,
          role_ids,
          status,
          password
        }, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        
        getUsersData(1);
        getAllUsersData();
        setCurrentPage(1);
      } catch (error) {
        console.error('Error adding user:', error);
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
  const containerStyle = sidebarVisible
  ? { padding: '60px 1% 0 17%', backgroundColor: 'aliceblue', overflowX: 'hidden', minHeight: '100vh',maxWidth: '99vw' }
  : { padding: '60px 0 0 30px',backgroundColor: 'aliceblue', overflowX: 'hidden', minHeight: '100vh',minWidth: '100vw'};
  return (
    <div className="container" style={containerStyle}>
      <h1>Users</h1>
      <div className="mb-3 d-flex align-items-center">
        <Select
          className="form-control me-2"
          placeholder="Search users..."
          value={selectedUser}
          onChange={handleFilterChange}
          options={dropdownOptions}
          isClearable
        />
        <Select
          className="form-control me-2"
          placeholder="Filter by role..."
          value={selectedRole}
          onChange={handleRoleFilterChange}
          options={roles.map(role => ({ value: role.id, label: role.name }))}
          isClearable
        />
        <Select
          className="form-control me-2"
          placeholder="Filter by status..."
          value={selectedStatus}
          onChange={handleStatusFilterChange}
          options={[
            { value: 1, label: 'Active' },
            { value: 0, label: 'Inactive' }
          ]}
          isClearable
        />
        <Button
          variant="secondary"
          className="me-2 rounded shadow btn-md d-flex align-items-center"
          style={{ backgroundImage: 'linear-gradient(45deg, #007bff, #0056b3)' }}
          onClick={handleFilter}
        >
          <i className="fa-solid fa-filter me-1"></i> Filter
        </Button>
        <Button
          variant="outline-danger"
          className="d-flex align-items-center"
          onClick={handleClearFilter}
        >
          <i className="fa-solid fa-times me-1"></i> Clear
        </Button>
      </div>
      <Button   
        variant="primary"
        onClick={handleAdd}
        className="mb-3 rounded shadow btn-md"
        style={{ backgroundImage: 'linear-gradient(45deg, #007bff, #0056b3)' }}
      >
        <i className="fa-solid fa-plus me-2"></i> Add New User
      </Button>
      <table className="table table-bordered mt-1">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Status</th>
            <th>Email</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {renderUserRows()}
        </tbody>
      </table>
      {!isFiltered && filteredUsers.length > 0 && (
        <Paginate
          paginator={paginator}
          currentPage={currentPage}
          pagechanged={(page) => setCurrentPage(page)}
        />
      )}
       <div className="copyright mt-5 text-end">
            Made with <span style={{ color: 'red' }}>❤️</span> by{' '}
            <a href="https://wintelbd.com/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#007BFF' }}>
              Wintel Limited
            </a>
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