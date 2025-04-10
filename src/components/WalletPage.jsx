import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Breadcrumb, Spinner, Alert } from "react-bootstrap";
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import axios from 'axios';
import Paginate from './Paginate';

// Base URL configuration
const API_BASE_URL = "https://mocktestadminapi.perppilot.com";

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
const WalletModal = ({ show, handleClose, handleSubmit, modalData, setModalData, isEditing, clients }) => {
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setLoading(true); // Disable button and show "Processing..."
    
    setTimeout(() => {
      handleSubmit(e, modalData);
      setLoading(false); // Enable button after delay
    }, 1500); // 1.5 seconds delay
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>{isEditing ? "Update Wallet" : "Create New Wallet"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleFormSubmit}>
          <Form.Group className="mb-3" controlId="formClient">
            <Form.Label>Client</Form.Label>
            <Form.Control
              as="select"
              value={modalData.client_id || ""}
              onChange={(e) => setModalData({ ...modalData, client_id: e.target.value })}
              required
              disabled={isEditing}
              className={isEditing ? "bg-light" : ""}
            >
              <option value="">Select client</option>
              {clients.map((client) => (
                <option key={client.value} value={client.value}>{client.label}</option>
              ))}
            </Form.Control>
            {isEditing && (
              <Form.Text className="text-muted">
                Client cannot be modified after wallet creation.
              </Form.Text>
            )}
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBalance">
            <Form.Label>Balance</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter balance"
              value={modalData.balance}
              onChange={(e) => setModalData({ ...modalData, balance: e.target.value })}
              required
              min="0"
              step="0.01"
            />
          </Form.Group>
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
              {loading ? "Processing..." : isEditing ? "Update" : "Add"} Wallet
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

// Main WalletPage Component
const WalletPage = ({ sidebarVisible: propSidebarVisible }) => {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState([]);
  const [filteredWallets, setFilteredWallets] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [walletsPerPage] = useState(10);
  const [paginator, setPaginator] = useState({
    current_page: 1,
    total_pages: 1,
    previous_page_url: null,
    next_page_url: null,
    record_per_page: 10,
    current_page_items_count: 0,
    total_count: 0,
    pagination_last_page: 1
  });
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    client_id: "",
    balance: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingWalletId, setEditingWalletId] = useState(null);
  const [isFiltered, setIsFiltered] = useState(false);
  const [clientOptions, setClientOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // State for tracking sidebar visibility based on screen size
  const [sidebarVisible, setSidebarVisible] = useState(propSidebarVisible);

  // Track screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setSidebarVisible(window.innerWidth >= 768 ? propSidebarVisible : false);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial value
    
    return () => window.removeEventListener('resize', handleResize);
  }, [propSidebarVisible]);

  // Fetch filter options (client list)
  const getFilterOptions = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No authentication token found');
      setAuthError(true);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/wallet/filter-data`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.data?.status === "success" && response.data?.data?.client_list) {
        setClientOptions(response.data.data.client_list);
        setClients(response.data.data.client_list);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
      if (error.response && error.response.status === 401) {
        setAuthError(true);
      }
      setLoading(false);
    }
  };

  const getWalletsData = (page = 1, clientId = null) => {
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
    let params = {};
    
    if (clientId) {
      url = `${API_BASE_URL}/api/v1/wallet/list-paginate`;
      params = { client_id: clientId, page, per_page: walletsPerPage };
    } else {
      url = `${API_BASE_URL}/api/v1/wallet/list-paginate`;
      params = { page, per_page: walletsPerPage };
    }

    axios.get(url, {
      params,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    })
    .then((response) => {
      if (response.data?.status === "success" && response.data?.data?.data) {
        setFilteredWallets(response.data.data.data);
        if (response.data?.data?.paginator) {
          setPaginator(response.data.data.paginator);
        }
      } else {
        console.warn("Unexpected API response format:", response.data);
        setFilteredWallets([]);
      }
      setTableLoading(false);
      setLoading(false);
    })
    .catch((error) => {
      console.error('Error fetching wallets:', error);
      if (error.response && error.response.status === 401) {
        setAuthError(true);
      }
      setFilteredWallets([]);
      setTableLoading(false);
      setLoading(false);
    });
  };

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        getFilterOptions(),
        getWalletsData(currentPage)
      ]);
    };
    
    initializeData();
  }, []);

  // Handle page change
  useEffect(() => {
    if (!loading) {
      getWalletsData(currentPage, selectedClient?.value);
    }
  }, [currentPage]);

  const handleFilterChange = (selectedOption) => {
    setSelectedClient(selectedOption);
  };

  const handleFilter = () => {
    setTableLoading(true);
    setCurrentPage(1);
    if (selectedClient) {
      setIsFiltered(true);
      getWalletsData(1, selectedClient.value);
    } else {
      setIsFiltered(false);
      getWalletsData(1);
    }
  };

  const handleClearFilter = () => {
    setSelectedClient(null);
    setIsFiltered(false);
    setCurrentPage(1);
    getWalletsData(1);
  };

  // Function to ensure button clicks work regardless of sidebar state
  const handleButtonClick = (e, callback) => {
    e.stopPropagation(); // Prevent event bubbling
    callback();
  };

  const renderWalletRows = () => {
    if (tableLoading) {
      return (
        <tr>
          <td colSpan="6" className="text-center py-4">
            <div className="d-flex justify-content-center align-items-center">
              <Spinner animation="border" variant="primary" />
              <span className="ms-3 text-muted">Loading wallets...</span>
            </div>
          </td>
        </tr>
      );
    }
    
    if (!Array.isArray(filteredWallets) || filteredWallets.length === 0) {
      return (
        <tr>
          <td colSpan="6" className="text-center py-4">
            <i className="fa-solid fa-wallet me-2"></i> No wallets found
          </td>
        </tr>
      );
    }
    
    return filteredWallets.map((wallet, index) => {
      const clientName = wallet.client?.name || 'Unknown Client';
      
      if (isMobile) {
        // Mobile view - stacked layout
        return (
          <tr key={wallet.id} className="align-middle">
            <td colSpan="6" className="p-0">
              <div className="card m-2 shadow-sm">
                <div className="card-body p-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                      <div className="bg-light rounded-circle p-2 me-2 text-center" style={{ width: '40px', height: '40px' }}>
                        <i className="fa-solid fa-wallet"></i>
                      </div>
                      <div>
                        <div className="fw-bold">{clientName}</div>
                        <div className="small text-muted">{wallet.client?.email}</div>
                      </div>
                    </div>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      className="rounded-circle" 
                      style={{ width: '32px', height: '32px' }}
                      onClick={(e) => handleButtonClick(e, () => handleEdit(wallet))}
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </Button>
                  </div>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    <div className="badge bg-success text-white px-2 py-1">
                      <i className="fa-solid fa-bangladeshi-taka-sign me-1"></i>
                      {wallet.balance}
                    </div>
                    <div className="badge bg-info text-dark px-2 py-1">
                      <i className="fa-solid fa-shopping-cart me-1"></i>
                      Purchase: {wallet.total_purchase_amount}
                    </div>
                    <div className="badge bg-warning text-dark px-2 py-1">
                      <i className="fa-solid fa-rotate-left me-1"></i>
                      Refund: {wallet.total_refund_amount}
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        );
      }
      
      // Desktop view - standard table layout
      return (
        <tr key={wallet.id} className="align-middle">
          <td className="ps-4">{isFiltered ? wallet.id : ((paginator.current_page - 1) * paginator.record_per_page) + index + 1}</td>
          <td>
            <div className="d-flex align-items-center">
              <div className="bg-light rounded-circle p-2 me-2 text-center" style={{ width: '40px', height: '40px' }}>
                <i className="fa-solid fa-wallet"></i>
              </div>
              <div>
                <div className="fw-bold">{clientName}</div>
                <div className="small text-muted">{wallet.client?.email}</div>
              </div>
            </div>
          </td>
          <td>
            <span className="badge bg-success text-white px-3 py-2">
              <i className="fa-solid fa-bangladeshi-taka-sign me-1"></i>
              {wallet.balance}
            </span>
          </td>
          <td>
            <span className="badge bg-info text-dark px-3 py-2">
              <i className="fa-solid fa-shopping-cart me-1"></i>
              {wallet.total_purchase_amount}
            </span>
          </td>
          <td>
            <span className="badge bg-warning text-dark px-3 py-2">
              <i className="fa-solid fa-rotate-left me-1"></i>
              {wallet.total_refund_amount}
            </span>
          </td>
          <td className="text-center">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={(e) => handleButtonClick(e, () => handleEdit(wallet))}
              className="px-2 py-1 rounded-2 border-0"
              title="Edit Wallet"
            >
              <i className="fa-solid fa-pen-to-square text-dark"></i>
            </Button>
          </td>
        </tr>
      );
    });
  };

  const handleAdd = () => {
    setIsEditing(false);
    setEditingWalletId(null);
    setModalData({
      client_id: "",
      balance: ""
    });
    setShowModal(true);
  };

  const handleEdit = (wallet) => {
    setIsEditing(true);
    setEditingWalletId(wallet.id);
    setModalData({
      id: wallet.id,
      client_id: wallet.client_id,
      balance: wallet.balance
    });
    setShowModal(true);
  };

  const handleModalSubmit = async (e, submitData) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error('No authentication token found');
      setAuthError(true);
      return;
    }
    
    try {
      if (isEditing) {
        await axios.post(`${API_BASE_URL}/api/v1/wallet/update`, submitData, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
      } else {
        await axios.post(`${API_BASE_URL}/api/v1/wallet/create`, submitData, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
      }
      
      // Refresh data after successful operation
      if (isFiltered && selectedClient) {
        getWalletsData(currentPage, selectedClient.value);
      } else {
        getWalletsData(currentPage);
      }
      getFilterOptions(); // Refresh the filter options
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} wallet:`, error);
      if (error.response && error.response.status === 401) {
        setAuthError(true);
      }
    }
  
    handleClose();
  };
  
  const handleClose = () => {
    setShowModal(false);
    setEditingWalletId(null);
  };

  // Define container class based on mobile and sidebar status
  const containerClass = isMobile 
    ? "page-container mobile-view" 
    : `page-container ${sidebarVisible ? "" : "expanded"}`;

  // Redirect to login if authentication error
  useEffect(() => {
    if (authError) {
      navigate('/login');
    }
  }, [authError, navigate]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="px-2 px-md-4">
        <div className="mb-3 pb-2 border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="fw-semibold text-primary mb-2 fs-5 fs-md-4">
              <i className="fa-solid fa-wallet me-2"></i>
              Wallet Management
            </h2>
            <Breadcrumb className="fs-7 d-none d-md-flex">
              <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Dashboard</Breadcrumb.Item>
              <Breadcrumb.Item active>Wallets</Breadcrumb.Item>
            </Breadcrumb>
          </div>

          <div className="d-flex flex-wrap gap-2 mt-3">
            <div className="d-flex align-items-center" style={{ width: isMobile ? '100%' : '300px' }}>
              <div className="flex-grow-1">
                <Select
                  options={clientOptions}
                  value={selectedClient}
                  onChange={handleFilterChange}
                  placeholder="Search by client..."
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
                  disabled={!selectedClient}
                >
                  <i className="fa-solid fa-xmark"></i>
                </Button>
              </div>
            </div>
          </div>

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

        <div className="bg-white rounded-3 shadow-sm overflow-hidden">
          <div className="table-responsive">
            <table className={`table table-hover mb-0 ${isMobile ? 'table-mobile' : ''}`}>
              {!isMobile && (
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 text-secondary small">#</th>
                    <th className="text-secondary small">CLIENT INFORMATION</th>
                    <th className="text-secondary small">BALANCE</th>
                    <th className="text-secondary small">TOTAL PURCHASE</th>
                    <th className="text-secondary small">TOTAL REFUND</th>
                    <th className="text-center text-secondary small">ACTIONS</th>
                  </tr>
                </thead>
              )}
              <tbody>
                {renderWalletRows()}
              </tbody>
            </table>
          </div>
        </div>

        {!isFiltered && !tableLoading && filteredWallets.length > 0 && (
          <div className="mt-4 d-flex justify-content-center justify-content-md-end">
            <Paginate
              paginator={paginator}
              currentPage={currentPage}
              pagechanged={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      <WalletModal
        show={showModal}
        handleClose={handleClose}
        handleSubmit={handleModalSubmit}
        modalData={modalData}
        setModalData={setModalData}
        isEditing={isEditing}
        clients={clients}
      />
    </div>
  );
};

export default WalletPage;