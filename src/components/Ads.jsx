import React, { useState, useEffect } from 'react';
import { Modal, Button, Table } from 'react-bootstrap';
import axios from 'axios';
import { min } from 'lodash';

const Ads = ({ sidebarVisible }) => {
  const [ads, setAds] = useState([]);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentAdId, setCurrentAdId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [visibleUpdateButtons, setVisibleUpdateButtons] = useState({});
  const [uploadedFilePath, setUploadedFilePath] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalSrc, setImageModalSrc] = useState('');

  const API_BASE_URL = "https://adminapi.lyricistsassociationbd.com";
  const filePath = `uploads/modules/home-ads/`;

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No authentication token found");
      return;
    }
  
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/home-ads/list-paginate`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const result = response.data;
      if (result.status === "success") {
        setAds(result.data.data || []);
      } else {
        console.error("Failed to fetch ads:", result.message);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error("Unauthenticated. Clearing token and redirecting.");
        localStorage.removeItem("authToken");
        alert("Session expired. Please log in again.");
        window.location.href = "/login";
      } else {
        console.error("Error fetching ads:", error);
      }
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    const fileName = selectedFile.name.split('.')[0];
    setFileName(fileName);

    try {
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
        const uploadedPath = `${filePath}${result.data.file_path.split('/').pop()}`;
        setUploadedFilePath(uploadedPath);
      } else {
        console.error("File upload failed:", result.message);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleUpload = async () => {
    if (!uploadedFilePath || !fileName) return;

    try {
      const token = localStorage.getItem("authToken");
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/api/v1/home-ads/update`, { id: currentAdId, file_name: fileName, file_path: uploadedFilePath }, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setIsEditing(false);
        setCurrentAdId(null);
      } else {
        await axios.post(`${API_BASE_URL}/api/v1/home-ads/create`, { file_name: fileName, file_path: uploadedFilePath }, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }

      fetchAds(); // Refresh the list after upload
      setShowModal(false);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleEdit = (id) => {
    setIsEditing(true);
    setCurrentAdId(id);
    setShowModal(true);
  };

  const handleAdd = () => {
    setFile(null);
    setFileName('');
    setUploadedFilePath('');
    setIsEditing(false);
    setCurrentAdId(null);
    setShowModal(true);
  };

  const toggleUpdateButton = (adId) => {
    setVisibleUpdateButtons((prevState) => ({
      ...prevState,
      [adId]: !prevState[adId],
    }));
  };

  const handleImageClick = (src) => {
    setImageModalSrc(src);
    setShowImageModal(true);
  };

  const containerStyle = sidebarVisible
    ? { padding: '60px 0 0 20%', backgroundColor: 'aliceblue', overflowX: 'hidden', minHeight: '100vh',minWidth: '100vw' }
    : { padding: '60px 0 0 30px',backgroundColor: 'aliceblue', overflowX: 'hidden', minHeight: '100vh',maxWidth: '100vw'};

  return (
    <div className="container" style={containerStyle}>
      <h1>Ads</h1>
      <Button variant="primary" onClick={handleAdd} style={{ backgroundImage: 'linear-gradient(45deg, #007bff, #0056b3)' }} className="mb-3 rounded shadow btn-md">
        <i className="fa-solid fa-plus me-2"></i> Create New Ad
      </Button>
      <Table bordered>
        <thead>
          <tr>
            <th>Image</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {ads.length > 0 ? (
            ads.map((ad) => (
              <tr key={ad.id}>
                <td>
                  <img 
                    src={`${API_BASE_URL}/${ad.file_path}`} 
                    alt={ad.file_name} 
                    width="100" 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => handleImageClick(`${API_BASE_URL}/${ad.file_path}`)} 
                  />
                </td>
                <td className="text-center">
                  <Button variant="link" onClick={() => handleEdit(ad.id)}>
                    <i className="fa-solid fa-pen-to-square text-dark"></i>
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2">No ads available</td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Modal Component */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? "Update Ad" : "Create New Ad"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <form onSubmit={(e) => { e.preventDefault(); handleUpload(); }}>
            <div className="mb-3">
              <label htmlFor="fileInput" className="form-label">Upload Image</label>
              <input type="file" className="form-control" id="fileInput" onChange={handleFileChange} required />
            </div>
            <div className="text-end">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Close
              </Button>
              <Button type="submit" variant="primary" className="ms-2">
                {isEditing ? "Update Ad" : "Create Ad"}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      {/* Image Modal */}
      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} size="lg" centered >
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body className="d-flex justify-content-center">
          <img src={imageModalSrc} alt="Ad" style={{ width: '100%', height: 'auto' }} />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Ads;