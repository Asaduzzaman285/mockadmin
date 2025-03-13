import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Form } from 'react-bootstrap';
import axios from 'axios';
import Select from 'react-select';
import Paginate from './Paginate';

const Orders = ({sidebarVisible}) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
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

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({});
  const [shipmentStatus, setShipmentStatus] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [orderStatus, setOrderStatus] = useState("Processing");
  const [deliveryCharge, setDeliveryCharge] = useState(80);
  const [paidAmount, setPaidAmount] = useState(0);


  const [filterData, setFilterData] = useState({
    order_number_list: [],
    payment_method_list: [],
    payment_status_list: [],
    order_status_list: [],
    shipment_status_list: []
  });

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState(null);
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const API_BASE_URL = "https://adminapi.lyricistsassociationbd.com";


  const handleAuthError = () => {
    alert("Authentication failed. Please log in again.");
   
    window.location.href = "/login";
  };


  const handleApiError = (error) => {
    console.error("API Error:", error);
    if (error.response?.status === 401) {
      handleAuthError();
    } else {
      alert("An error occurred. Please try again.");
    }
  };

  const calculatePaymentStatus = (paidAmount, total) => {
    if (paidAmount === 0) return 1; // Unpaid
    if (paidAmount === total) return 2; // Paid
    if (paidAmount > 0 && paidAmount < total) return 3; // Partially Paid
    return 1; // Default to Unpaid
  };

  
  const getPaymentStatusLabel = (statusId) => {
    switch (statusId) {
      case 1: return "Unpaid";
      case 2: return "Paid";
      case 3: return "Partially Paid";
      default: return "Unpaid";
    }
  };


  const getPaymentStatusBadgeClass = (statusId) => {
    switch (statusId) {
      case 1: return "badge bg-danger text-white";
      case 2: return "badge bg-success text-white";
      case 3: return "badge bg-warning text-dark";
      default: return "badge bg-danger text-white";
    }
  };


  const handleFilter = () => {
  
    setCurrentPage(1);
    fetchOrders();
  };

 
  const handleClearFilter = () => {
   
    setSelectedOrder(null);
    setOrderStatusFilter(null);
    setPaymentStatusFilter(null);
    setPaymentMethodFilter(null);
    setShipmentStatusFilter(null);
    setStartDate('');
    setEndDate('');
    
  
    setCurrentPage(1);
    

    fetchOrders();
  };


  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    fetchOrders();
    fetchFilterData();
  }, [currentPage]);

  const fetchFilterData = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      handleAuthError();
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/cart/filter-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.status === "success") {
        // Add "Partially Paid" to payment status list if not exists
        const updatedPaymentStatusList = [...response.data.data.payment_status_list];
        if (!updatedPaymentStatusList.find(status => status.value === 3)) {
          updatedPaymentStatusList.push({ value: 3, label: "Partially Paid" });
        }
        setFilterData({
          ...response.data.data,
          payment_status_list: updatedPaymentStatusList
        });
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const fetchOrders = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      handleAuthError();
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('per_page', ordersPerPage);

      if (selectedOrder?.value) params.append('order_number', selectedOrder.label);
      if (orderStatusFilter) params.append('order_status_id', orderStatusFilter.value);
      if (paymentStatusFilter) params.append('payment_status_id', paymentStatusFilter.value);
      if (paymentMethodFilter) params.append('payment_method_id', paymentMethodFilter.value);
      if (shipmentStatusFilter) params.append('shipment_status_id', shipmentStatusFilter.value);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/cart/list-paginate?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.status === "success") {
        const { data, paginator: paginatorData } = response.data.data;
        
        // Calculate correct payment status for each order
        const updatedData = data.map(order => ({
          ...order,
          total: Number(order.sub_total) + Number(order.delivery_charge),
          payment_status: calculatePaymentStatus(
            Number(order.paid_amount),
            Number(order.sub_total) + Number(order.delivery_charge)
          )
        }));

        setOrders(updatedData);
        setFilteredOrders(updatedData);
        setPaginator(paginatorData);
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleViewDetails = (order) => {
    const total = Number(order.sub_total) + Number(order.delivery_charge);
    setModalData(order);
    setShipmentStatus(
      filterData.shipment_status_list.find(
        status => status.value === order.shipment_status_id
      )?.label || ""
    );
    setPaymentStatus(getPaymentStatusLabel(order.payment_status));
    setOrderStatus(
      filterData.order_status_list.find(
        status => status.value === order.order_status_id
      )?.label || "Processing"
    );
    setDeliveryCharge(order.delivery_charge || 80);
    setPaidAmount(order.paid_amount || 0);
    setShowModal(true);
  };

  const handleUpdate = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      handleAuthError();
      return;
    }

    const totalAmount = Number(modalData.sub_total) + Number(deliveryCharge);
    const paymentStatusId = calculatePaymentStatus(Number(paidAmount), totalAmount);

    const updatedData = {
      id: modalData.id,
      shipment_status_id: filterData.shipment_status_list.find(
        status => status.label === shipmentStatus
      )?.value || null,
      order_status_id: filterData.order_status_list.find(
        status => status.label === orderStatus
      )?.value || null,
      payment_status_id: paymentStatusId,
      paid_amount: paidAmount,
      due: totalAmount - paidAmount,
      delivery_charge: deliveryCharge,
      payment_method_id: modalData.payment_method_id,
      total: totalAmount
    };

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/cart/update`,
        updatedData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json" 
          }
        }
      );

      if (response.data.status === "success") {
        alert("Order updated successfully!");
        setShowModal(false);
        fetchOrders(); // Refresh the orders list
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const renderOrderRows = () => {
    return filteredOrders.map((order) => (
      <tr key={order.id} style={{ fontSize: '12px' }}>
        <td>{order.order_number}</td>
        <td>
          <div>Name: {order.name}</div>
          <div>Email: {order.email}</div>
          <div>Phone: {order.phone}</div>
          <div>Address: {order.shipping_address}</div>
        </td>
        <td>
          <div>Subtotal: {order.sub_total} TK</div>
          <div>Delivery Charge: {order.delivery_charge} TK</div>
          <div>Total: {Number(order.sub_total) + Number(order.delivery_charge)} TK</div>
          <div>Due: {(Number(order.sub_total) + Number(order.delivery_charge)) - Number(order.paid_amount)} TK</div>
          <div>Paid Amount: {order.paid_amount} TK</div>
          <div>
            <span className={getPaymentStatusBadgeClass(order.payment_status)}>
              {getPaymentStatusLabel(order.payment_status)}
            </span>
          </div>
        </td>
        {/* <td>
          {order.order_detail.map(detail => (
            <div key={detail.id}>{detail.product.name} x {detail.qty}</div>
          ))}
        </td> */}
        <td>
          <Table bordered className="table-sm">
            <tbody>
              {filterData.order_status_list.map(status => (
                <tr key={status.value}>
                  <td>{status.label}</td>
                  {status.value <= order.order_status_id && (
                    <td>
                      <i className="fa-regular fa-circle-check" style={{ color: "green" }}></i>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </td>
        <td>
          {filterData.shipment_status_list.find(
            status => status.value === order.shipment_status_id
          )?.label || "Pending"}
        </td>
        <td className="text-center">
          <Button variant="link" onClick={() => handleViewDetails(order)}>
            <i className="fa-solid fa-pen-to-square text-dark"></i>
          </Button>
        </td>
      </tr>
    ));
  };
  const containerStyle = sidebarVisible
  ? { padding: '60px 1% 0 17%', backgroundColor: 'aliceblue', overflowX: 'hidden', minHeight: '100vh',maxWidth: '99vw' }
  : { padding: '60px 0 0 30px',backgroundColor: 'aliceblue', overflowX: 'hidden', minHeight: '100vh',maxWidth: '100vw'};
  return (
    <div className="container" style={containerStyle}>
      <h1>Orders</h1>   
      <div className="mb-3 d-flex flex-column">
  <div className="d-flex align-items-center mb-2">
    <Select
      className="form-control me-2"
      placeholder="Order No"
      value={selectedOrder}
      onChange={setSelectedOrder}
      options={filterData.order_number_list}
      isClearable
    />
    <Select
      className="form-control me-2"
      placeholder="Order Status"
      value={orderStatusFilter}
      onChange={setOrderStatusFilter}
      options={filterData.order_status_list}
      isClearable
    />
    <Select
      className="form-control me-2"
      placeholder="Payment Status"
      value={paymentStatusFilter}
      onChange={setPaymentStatusFilter}
      options={filterData.payment_status_list}
      isClearable
    />
    <Select
      className="form-control me-2"
      placeholder="Payment Method"
      value={paymentMethodFilter}
      onChange={setPaymentMethodFilter}
      options={filterData.payment_method_list}
      isClearable
    />
  </div>

  <div className="d-flex align-items-center mb-2 ">
    <Select
      className="form-control me-2"
      placeholder="Shipment Status"
      value={shipmentStatusFilter}
      onChange={setShipmentStatusFilter}
      options={filterData.shipment_status_list}
      isClearable
    />


 <Form.Group className="form-floating me-2 ">
  <Form.Control
    type="date"
    id="startDate"
    className="form-control"
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
    placeholder="Start Date"
  />
  <Form.Label htmlFor="startDate">Start Date</Form.Label>
</Form.Group>

<Form.Group className="form-floating me-2 ">
  <Form.Control
    type="date"
    id="endDate"
    className="form-control"
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
    placeholder="End Date"
  />
  <Form.Label htmlFor="endDate">End Date</Form.Label>
</Form.Group>
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
</div>
      <Table bordered className="table-striped table-hover">
        <thead>
        <tr>
            <th>Order Number</th>
            <th style={{ width: "80px" }}>Customer Info</th>
            <th style={{ width: "200px" }}>Payment Info</th>
            {/* <th style={{ width: "60px" }}>Order Details</th> */}
            <th>Order Status</th>
            <th>Shipment Status</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>{renderOrderRows()}</tbody>
      </Table>

      {paginator?.total_pages > 1 && (
        <Paginate
          paginator={paginator}
          currentPage={currentPage}
          pagechanged={handlePageChange}
        />
      )}

<Modal dialogClassName="custom-modal" show={showModal} onHide={() => setShowModal(false)} size="lg">
  <Modal.Header closeButton>
    <Modal.Title>Update Order</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {modalData && (
      <>
        <p><strong>Order Number:</strong> {modalData.order_number}</p>
        <p><strong>Name:</strong> {modalData.name}</p>
        <p><strong>Email:</strong> {modalData.email}</p>
        <p><strong>Phone:</strong> {modalData.phone}</p>
        <p><strong>Shipping Address:</strong> {modalData.shipping_address}</p>
        
        <Form.Group className="mb-3">
          <Form.Label>Shipment Status</Form.Label>
          <Form.Control 
            as="select" 
            value={shipmentStatus}
            onChange={(e) => setShipmentStatus(e.target.value)}
          >
            {filterData.shipment_status_list.map(status => (
              <option key={status.value} value={status.label}>{status.label}</option>
            ))}
          </Form.Control>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Order Status</Form.Label>
          <Form.Control 
            as="select" 
            value={orderStatus}
            onChange={(e) => setOrderStatus(e.target.value)}
          >
            {filterData.order_status_list.map(status => (
              <option key={status.value} value={status.label}>{status.label}</option>
            ))}
          </Form.Control>
        </Form.Group>
        
        <Table bordered className="table  table-sm table-hover">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {modalData.order_detail && modalData.order_detail.map(detail => (
              <tr key={detail.id}>
                <td>{detail.product.name}</td>
                <td>{detail.price} TK</td>
                <td>{detail.qty}</td>
                <td>{detail.price * detail.qty} TK</td>
              </tr>
            ))}
            <tr>
              <td colSpan="3" align='right'><strong>Subtotal</strong></td>
              <td>{modalData.sub_total} TK</td>
            </tr>
            <tr>
              <td colSpan="3" align='right'><strong>Delivery Charge</strong></td>
              <td>
                <Form.Control 
                  type="number" 
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(Number(e.target.value))}
                />
              </td>
            </tr>
            <tr>
              <td colSpan="3" align='right'><strong>Total</strong></td>
              <td>{Number(modalData.sub_total) + Number(deliveryCharge)} TK</td>
            </tr>
            <tr>
              <td colSpan="3" align='right'><strong>Paid Amount</strong></td>
              <td>
                <Form.Control 
                  type="number" 
                  value={paidAmount}
                  onChange={(e) => {
                    const newPaidAmount = Number(e.target.value);
                    setPaidAmount(newPaidAmount);
                    const total = Number(modalData.sub_total) + Number(deliveryCharge);
                    const newPaymentStatus = calculatePaymentStatus(newPaidAmount, total);
                    setPaymentStatus(getPaymentStatusLabel(newPaymentStatus));
                  }}
                />
              </td>
            </tr>
            <tr>
              <td colSpan="3" align='right'><strong>Due</strong></td>
              <td>{Math.max(0, Number(modalData.sub_total) + Number(deliveryCharge) - Number(paidAmount))} TK</td>
            </tr>
            <tr>
              <td colSpan="3" align="right"><strong>Payment Status:</strong></td>
              <td>
                <div className="payment-summary">
                  <span className={getPaymentStatusBadgeClass(calculatePaymentStatus(
                    Number(paidAmount),
                    Number(modalData.sub_total) + Number(deliveryCharge)
                  ))}>
                    {paymentStatus}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </Table>
      </>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowModal(false)}>
      Close
    </Button>
    <Button 
      variant="primary" 
      onClick={handleUpdate}
      disabled={Number(paidAmount) > Number(modalData.sub_total) + Number(deliveryCharge)}
    >
      Update Order
    </Button>
  </Modal.Footer>
</Modal>

    </div>
  );
};

export default Orders;