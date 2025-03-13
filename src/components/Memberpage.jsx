import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Spinner } from 'react-bootstrap';
import axios from 'axios';
import Select from 'react-select';
import Paginate from './Paginate'; 

const MemberPage = ({sidebarVisible}) => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({
    member: null,
    status: null,
    position: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [membersPerPage] = useState(10); // Adjust as needed
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
    bio: "",
    videoUrl: "",
    position: "",
    memberStatus: { value: "2", label: "Approved" }, // Default status
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [visibleUpdateButtons, setVisibleUpdateButtons] = useState({});
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalSrc, setImageModalSrc] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const [filterOptions, setFilterOptions] = useState([]);
  const [memberStatusOptions, setMemberStatusOptions] = useState([]);
  const [positionOptions, setPositionOptions] = useState([]);

  const API_BASE_URL = "https://adminapi.lyricistsassociationbd.com";

  useEffect(() => {
    fetchMembers();
    fetchFilterOptions();
  }, [currentPage]);

  const fetchMembers = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No authentication token found");
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/members/list-paginate?page=${currentPage}&per_page=${membersPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = response.data;
      if (result.status === "success") {
        setMembers(result.data.data);
        setFilteredMembers(result.data.data);
        setPaginator(result.data.paginator);
      } else {
        console.error("Failed to fetch members:", result.message);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error("Unauthenticated. Clearing token and redirecting.");
        localStorage.removeItem("authToken");
        alert("Session expired. Please log in again.");
        window.location.href = "/login";
      } else {
        console.error("Error fetching members:", error);
      }
    }
  };

  // Toggle visibility of update button
  const toggleUpdateButton = (memberId) => {
    setVisibleUpdateButtons((prevState) => ({
      ...prevState,
      [memberId]: !prevState[memberId],
    }));
  };

  const fetchFilterOptions = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No authentication token found");
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/members/filter-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = response.data;
      if (result.status === "success") {
        setFilterOptions(result.data.name_list);
        setMemberStatusOptions(result.data.member_status_list);
        setPositionOptions(result.data.position_list);
      } else {
        console.error("Failed to fetch filter options:", result.message);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  // Handle filter change
  const handleFilterChange = (selectedOption, filterType) => {
    setSelectedFilters((prevFilters) => ({
      ...prevFilters,
      [filterType]: selectedOption,
    }));
  };


  const handleFilter = () => {
    let filtered = members;
    if (selectedFilters.member) {
      filtered = filtered.filter(member => member.id === Number(selectedFilters.member.value));
    }
    if (selectedFilters.status) {
      filtered = filtered.filter(member => member.member_status_id === selectedFilters.status.value);
    }
    if (selectedFilters.position) {
      filtered = filtered.filter(member => member.position === selectedFilters.position.label);
    }

    setFilteredMembers(filtered);
    setCurrentPage(1);
  };

  const handleClearFilter = () => {
    setSelectedFilters({
      member: null,
      status: null,
      position: null,
    });
    setFilteredMembers(members);
    setCurrentPage(1); 
  };

  const handleAdd = () => {
    setModalData({
      image: null,
      name: "",
      bio: "",
      videoUrl: "",
      position: "",
      memberStatus: { value: "2", label: "Approved" }, 
    });
    setIsEditing(false);
    setEditingMemberId(null);
    setShowModal(true);
  };

  const handleEdit = (member) => {
    const correctedFilePath = member.file_path ? `${API_BASE_URL}${member.file_path.replace('//', '/')}` : null;
    const memberStatus = memberStatusOptions.find(status => status.value === member.member_status_id) || { value: "2", label: "Approved" };

    setModalData({
      image: correctedFilePath,
      name: member.name,
      bio: member.bio,
      videoUrl: member.youtube_url,
      position: member.position || "",
      memberStatus,
    });
    setIsEditing(true);
    setEditingMemberId(member.id);
    setShowModal(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
  
    const fileName = file.name.split('.')[0];
    const filePath = `uploads/modules/members/`;
  
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
    const { name, bio, videoUrl, image, position, memberStatus } = modalData;
  
    const apiEndpoint = isEditing
      ? `${API_BASE_URL}/api/v1/members/update`
      : `${API_BASE_URL}/api/v1/members/create`;
  
    const payload = {
      id: editingMemberId,
      name,
      bio,
      youtube_url: videoUrl,
      file_path: image ? image.replace(API_BASE_URL, '') : modalData.image,
      position,
      member_status_id: memberStatus.value,
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
        fetchMembers();
        setShowModal(false);
        setEditingMemberId(null);
      } else {
        console.error("Failed to save member:", result.message);
      }
    } catch (error) {
      console.error("Error saving member:", error);
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

  const renderMemberRows = () => {
    return filteredMembers.map((member) => {
      const correctedFilePath = member.file_path 
        ? `${API_BASE_URL}${member.file_path.replace('//', '/')}` 
        : "";
      const memberStatus = memberStatusOptions.find(
        status => status.value === member.member_status_id
      )?.label || "Unknown";

      return (
        <tr key={member.id}>
          <td>
            <img
              src={correctedFilePath}
              alt={member.name}
              style={{ width: "50px", height: "50px", objectFit: "cover", cursor: 'pointer' }}
              onClick={() => handleImageClick(correctedFilePath)}
            />
          </td>
          <td>{member.name}</td>
          <td>{member.bio}</td>
          <td>{member.position}</td>
          <td style={{ textAlign: "center" }}>
            {member.youtube_url ? (
              <a 
                href={member.youtube_url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <i 
                  className="fa-brands fa-youtube" 
                  style={{ fontSize: "2rem", color: "red" }}
                ></i>
              </a>
            ) : (
              "N/A"
            )}
          </td>
          <td>{memberStatus}</td>
          <td className="text-center">
            <Button variant="link" onClick={() => handleEdit(member)}>
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
    <div className="container mt-5" style={containerStyle}>
      <h1>Members</h1>
      <div className="mb-3 d-flex align-items-center">
        <Select
          className="form-control me-2"
          placeholder="Search members..."
          value={selectedFilters.member}
          onChange={(option) => handleFilterChange(option, 'member')}
          options={filterOptions}
        />
        <Select
          className="form-control me-2"
          placeholder="Filter by status..."
          value={selectedFilters.status}
          onChange={(option) => handleFilterChange(option, 'status')}
          options={memberStatusOptions}
        />
        <Select
          className="form-control me-2"
          placeholder="Filter by position..."
          value={selectedFilters.position}
          onChange={(option) => handleFilterChange(option, 'position')}
          options={positionOptions}
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
        <i className="fa-solid fa-plus me-2"></i> Create New Member
      </Button>
      <Table bordered>
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Bio</th>
            <th>Position</th>
            <th>Youtube URL</th>
            <th>Status</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>{renderMemberRows()}</tbody>
      </Table>
      {paginator?.total_pages > 1 && renderPagination()}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? "Update Member" : "Create New Member"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form onSubmit={handleModalSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Upload Image</Form.Label>
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
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={modalData.name}
                onChange={(e) =>
                  setModalData({ ...modalData, name: e.target.value })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Bio</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={modalData.bio}
                onChange={(e) =>
                  setModalData({ ...modalData, bio: e.target.value })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Video URL</Form.Label>
              <Form.Control
                type="text"
                value={modalData.videoUrl}
                onChange={(e) =>
                  setModalData({ ...modalData, videoUrl: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Position</Form.Label>
              <Form.Control
                type="text"
                value={modalData.position}
                onChange={(e) =>
                  setModalData({ ...modalData, position: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Select
                value={modalData.memberStatus}
                onChange={(selectedOption) =>
                  setModalData({ ...modalData, memberStatus: selectedOption })
                }
                options={memberStatusOptions}
              />
            </Form.Group>

            <div className="text-end">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Close
              </Button>
              <Button type="submit" variant="primary" className="ms-2">
                {isEditing ? "Update Member" : "Create Member"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Image Modal */}
      <Modal className='ms-5' show={showImageModal} onHide={() => setShowImageModal(false)} size="lg" centered>
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body className="d-flex justify-content-center">
          <img src={imageModalSrc} alt="Member" style={{ width: '100%', height: 'auto' }} />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default MemberPage;