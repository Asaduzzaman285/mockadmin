import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Spinner } from 'react-bootstrap';
import axios from 'axios';
import Select from 'react-select';
import Paginate from './Paginate';

const ContentPage = ({sidebarVisible}) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);
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
  const [modalData, setModalData] = useState({
    image: null,
    name: "",
    price: "",
    description: "",
    member_id: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [visibleUpdateButtons, setVisibleUpdateButtons] = useState({});
  const [members, setMembers] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalSrc, setImageModalSrc] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const API_BASE_URL = "https://adminapi.lyricistsassociationbd.com";

  useEffect(() => {
    fetchProducts();
    fetchMembers();
  }, [currentPage]);

  const fetchProducts = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No authentication token found");
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/product/list-paginate?page=${currentPage}&per_page=${productsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = response.data;
      if (result.status === "success") {
        setProducts(result.data.data);
        setFilteredProducts(result.data.data);
        setPaginator(result.data.paginator);
      } else {
        console.error("Failed to fetch products:", result.message);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error("Unauthenticated. Clearing token and redirecting.");
        localStorage.removeItem("authToken");
        alert("Session expired. Please log in again.");
        window.location.href = "/login";
      } else {
        console.error("Error fetching products:", error);
      }
    }
  };

  const fetchMembers = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No authentication token found");
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/members/list-paginate`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = response.data;
      if (result.status === "success") {
        setMembers(result.data.data);
      } else {
        console.error("Failed to fetch members:", result.message);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const toggleUpdateButton = (productId) => {
    setVisibleUpdateButtons((prevState) => ({
      ...prevState,
      [productId]: !prevState[productId],
    }));
  };

  const handleFilterChange = (selectedOption) => {
    setSelectedProduct(selectedOption);
  };

  const handleAuthorFilterChange = (selectedOption) => {
    setSelectedAuthor(selectedOption);
  };

  const handleFilter = () => {
    let filtered = [...products];
    
    if (selectedProduct) {
      filtered = filtered.filter(product => product.id === selectedProduct.value);
    }
    
    if (selectedAuthor) {
      filtered = filtered.filter(product => product.member.id === selectedAuthor.value);
    }
    
    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const handleClearFilter = () => {
    setSelectedProduct(null);
    setSelectedAuthor(null);
    setFilteredProducts(products);
    setCurrentPage(1);
  };

  const handleAdd = () => {
    setModalData({
      image: null,
      name: "",
      price: "",
      description: "",
      member_id: null,
    });
    setIsEditing(false);
    setEditingProductId(null);
    setShowModal(true);
  };

  const handleEdit = (product) => {
    const correctedFilePath = product.file_path ? `${API_BASE_URL}${product.file_path.replace('//', '/')}` : null;
  
    setModalData({
      image: correctedFilePath,
      name: product.name,
      price: product.price,
      description: product.description,
      member_id: product.member_id,
    });
    setIsEditing(true);
    setEditingProductId(product.id);
    setShowModal(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
  
    const fileName = file.name.split('.')[0];
    const filePath = `uploads/modules/product/`;
  
    try {
      setIsUploading(true);
      const token = localStorage.getItem("authToken");
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/file/file-upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          params: {
            file_name: fileName,
            file_path: filePath,
          },
        }
      );
  
      const result = response.data;
      if (result.status === "success") {
        const correctedFilePath = `${API_BASE_URL}/${filePath}${result.data.file_path.split('/').pop()}`;
        setModalData({ ...modalData, image: correctedFilePath });
      } else {
        console.error("File upload failed:", result.message);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    const { name, price, description, image, member_id } = modalData;
  
    const apiEndpoint = isEditing
      ? `${API_BASE_URL}/api/v1/product/update`
      : `${API_BASE_URL}/api/v1/product/create`;
  
    const payload = {
      id: editingProductId,
      name,
      price,
      description,
      file_path: image ? image.replace(API_BASE_URL, '') : modalData.image,
      member_id,
    };
  
    try {
      const response = await axios({
        url: apiEndpoint,
        method: isEditing ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: payload,
      });
  
      const result = response.data;
      if (result.status === "success") {
        fetchProducts();
        setShowModal(false);
        setEditingProductId(null);
      } else {
        console.error("Failed to save product:", result.message);
      }
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPagination = () => {
    return (
      <Paginate
        paginator={paginator}
        currentPage={currentPage}
        pagechanged={handlePageChange}
      />
    );
  };

  const handleImageClick = (src) => {
    setImageModalSrc(src);
    setShowImageModal(true);
  };

  const renderProductRows = () => {
    return filteredProducts.map((product) => {
      const correctedFilePath = product.file_path ? `${API_BASE_URL}${product.file_path.replace('//', '/')}` : "";
      const memberName = product.member ? product.member.name : "Unknown";

      return (
        <tr key={product.id}>
          <td>
            <img
              src={correctedFilePath}
              alt={product.name}
              style={{ width: "50px", height: "50px", objectFit: "cover", cursor: 'pointer' }}
              onClick={() => handleImageClick(correctedFilePath)}
            />
          </td>
          <td>{product.name}</td>
          <td>{product.price}</td>
          <td>{product.description}</td>
          <td>{memberName}</td>
          <td className="text-center">
            <Button variant="link" onClick={() => handleEdit(product)}>
              <i className="fa-solid fa-pen-to-square text-dark"></i>
              </Button>
          </td>
        </tr>
      );
    });
  };
  const containerStyle = sidebarVisible
  ? { padding: '60px 1% 0 17%', backgroundColor: 'aliceblue', overflowX: 'hidden', minHeight: '100vh',maxWidth: '99vw' }
  : { padding: '60px 0 0 30px',backgroundColor: 'aliceblue', overflowX: 'hidden', minHeight: '100vh',maxWidth: '100vw'};
  return (
    <div className="container" style={containerStyle}>
      <h1>Products</h1>
      <div className="mb-3">
        <div className="row">
          <div className="col-md-4">
            <Select
              className="mb-2"
              placeholder="Search by product name..."
              value={selectedProduct}
              onChange={handleFilterChange}
              options={products.map(product => ({ value: product.id, label: product.name }))}
              isClearable
            />
          </div>
          <div className="col-md-4">
            <Select
              className="mb-2"
              placeholder="Search by author name..."
              value={selectedAuthor}
              onChange={handleAuthorFilterChange}
              options={Array.from(new Set(products.map(product => product.member))).map(member => ({
                value: member.id,
                label: member.name
              }))}
              isClearable
            />
          </div>
          <div className="col-md-2">
            <div className="d-flex">
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
        </div>
      </div>

      <Button
        variant="primary"
        onClick={handleAdd}
        className="mb-3 rounded shadow btn-md"
        style={{ backgroundImage: 'linear-gradient(45deg, #007bff, #0056b3)' }}
      >
        <i className="fa-solid fa-plus me-2"></i> Create New Product
      </Button>

      <Table bordered>
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Price</th>
            <th>Description</th>
            <th>Author</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>{renderProductRows()}</tbody>
      </Table>
      {paginator?.total_pages > 1 && renderPagination()}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? "Edit Product" : "Add Product"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModalSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Product Image</Form.Label>
              {isUploading ? (
                <div className="mb-3 d-flex justify-content-center">
                  <Spinner animation="border" />
                </div>
              ) : (
                modalData.image && (
                  <div className="mb-3">
                    <img
                      src={modalData.image}
                      alt="Current"
                      style={{ width: "100px", height: "100px", objectFit: "cover" }}
                    />
                  </div>
                )
              )}
              <Form.Control type="file" onChange={handleFileChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Product Name</Form.Label>
              <Form.Control
                type="text"
                value={modalData.name}
                onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Product Price</Form.Label>
              <Form.Control
                type="number"
                value={modalData.price}
                onChange={(e) => setModalData({ ...modalData, price: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Product Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={modalData.description}
                onChange={(e) =>
                  setModalData({ ...modalData, description: e.target.value })
                }
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Member</Form.Label>
              <Form.Select
                value={modalData.member_id || ""}
                onChange={(e) =>
                  setModalData({ ...modalData, member_id: e.target.value })
                }
              >
                <option value="">Select Member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {isEditing ? "Update Product" : "Add Product"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Image Modal */}
      <Modal className='ms-5' show={showImageModal} onHide={() => setShowImageModal(false)} size="lg" centered>
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body className="d-flex justify-content-center">
          <img src={imageModalSrc} alt="Product" style={{ width: '100%', height: 'auto' }} />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ContentPage;