import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Spinner } from 'react-bootstrap';
import axios from 'axios';
import Select from 'react-select';
import Paginate from './Paginate';

const SuccessStories = ({ sidebarVisible }) => {
  const [stories, setStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [storiesPerPage] = useState(10);
  const [paginator, setPaginator] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    image: null,
    headline: "",
    subheading: "",
    details: "",
    date: "",
    member_id: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState(null);
  const [filterOptions, setFilterOptions] = useState([]);
  const [memberOptions, setMemberOptions] = useState([]);
  const [filterKey, setFilterKey] = useState(0);
  const [expandedStoryId, setExpandedStoryId] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalSrc, setImageModalSrc] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const API_BASE_URL = "https://adminapi.lyricistsassociationbd.com";

  useEffect(() => {
    fetchStories();
    fetchFilterOptions();
  }, [currentPage]);

  const fetchStories = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No authentication token found");
      return;
    }
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/success-stories/list-paginate?page=${currentPage}&per_page=${storiesPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = response.data;
      if (result.status === "success") {
        setStories(result.data.data);
        setFilteredStories(result.data.data);
        setPaginator(result.data.paginator);
      } else {
        console.error("Failed to fetch stories:", result.message);
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
    }
  };

  const fetchFilterOptions = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No authentication token found");
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/success-stories/filter-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = response.data;
      if (result.status === "success") {
        setFilterOptions(result.data.headline);
        setMemberOptions(result.data.members);
      } else {
        console.error("Failed to fetch filter options:", result.message);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  const handleFileUpload = async (file) => {
    const token = localStorage.getItem("authToken");
    const formData = new FormData();
    formData.append("file", file);
    const fileName = file.name.split('.')[0];
    const filePath = `uploads/modules/success-stories/`;
    try {
      setIsUploading(true);
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

  const handleFilterChange = (selectedOption, filterType) => {
    if (filterType === 'headline') {
      setSearchTerm(selectedOption ? selectedOption.label : "");
    } else if (filterType === 'member') {
      setSelectedMember(selectedOption ? selectedOption.value : null);
    }
  };

  const applyFilters = () => {
    let filtered = stories;

    if (searchTerm) {
      filtered = filtered.filter(story =>
        story.headline.toLowerCase() === searchTerm.toLowerCase()
      );
    }

    if (selectedMember) {
      filtered = filtered.filter(story => story.member_id === selectedMember);
    }

    setFilteredStories(filtered);
    // setCurrentPage(1);
  };

  const handleClearFilter = () => {
    setSearchTerm("");
    setSelectedMember(null);
    setFilteredStories(stories);
    setCurrentPage(1);
    setFilterKey(prevKey => prevKey + 1);
  };

  const handleAdd = () => {
    setModalData({
      image: null,
      headline: "",
      subheading: "",
      details: "",
      date: "",
      member_id: null,
    });
    setIsEditing(false);
    setEditingStoryId(null);
    setShowModal(true);
  };

  const handleEdit = (story) => {
    const correctedFilePath = story.file_path.startsWith(API_BASE_URL)
      ? story.file_path
      : `${API_BASE_URL}${story.file_path.replace('//', '/')}`;
    setModalData({
      image: correctedFilePath,
      headline: story.headline,
      subheading: story.subheading,
      details: story.details,
      date: story.posting_time,
      member_id: story.member_id,
    });
    setIsEditing(true);
    setEditingStoryId(story.id);
    setShowModal(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    const { headline, subheading, details, date, image, member_id } = modalData;
    const apiEndpoint = isEditing
      ? `${API_BASE_URL}/api/v1/success-stories/update`
      : `${API_BASE_URL}/api/v1/success-stories/create`;
    const payload = {
      id: editingStoryId,
      headline,
      subheading,
      details,
      posting_time: date,
      file_path: image.startsWith(API_BASE_URL) ? image.replace(API_BASE_URL, '') : image,
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
        fetchStories();
        setShowModal(false);
      } else {
        console.error("Failed to save story:", result.message);
      }
    } catch (error) {
      console.error("Error saving story:", error);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleImageClick = (src) => {
    setImageModalSrc(src);
    setShowImageModal(true);
  };

  const renderStories = () => {
    return filteredStories.map((story) => {
      const correctedFilePath = story.file_path ? `${API_BASE_URL}${story.file_path.replace('//', '/')}` : "";
      const memberName = memberOptions.find(member => member.value === story.member_id)?.label || "Unknown";
      const isExpanded = expandedStoryId === story.id;
      const storyDetails = isExpanded ? story.details : `${story.details.substring(0, 100)}...`;
  
      return (
        <tr key={story.id}>
          <td>{story.posting_time}</td>
          <td>{story.headline}</td>
          <td>{story.subheading}</td>
          <td className='col-2'>{memberName}</td>
          <td>
            {storyDetails}
            {story.details.length > 100 && (
              <span
                style={{ color: 'blue', cursor: 'pointer' }}
                onClick={() => setExpandedStoryId(isExpanded ? null : story.id)}
              >
                {isExpanded ? ' see less' : '...read more'}
              </span>
            )}
          </td>
          <td>
            {correctedFilePath && (
              <img
                src={correctedFilePath}
                alt={story.headline}
                style={{ width: "50px", height: "50px", objectFit: "cover", cursor: 'pointer' }}
                onClick={() => handleImageClick(correctedFilePath)}
                />
              )}
            </td>
            <td className="text-center">
              <Button variant="link" onClick={() => handleEdit(story)}>
                <i className="fa-solid fa-pen-to-square text-dark"></i>
              </Button>
            </td>
          </tr>
        );
      });
    };
    const containerStyle = sidebarVisible
    ? { padding: '60px 1% 0 17%', backgroundColor: 'aliceblue', overflowX: 'hidden', minHeight: '100vh',maxWidth: '99vw' }
    : { padding: '60px 0 0 30px',backgroundColor: 'aliceblue', overflowX: 'hidden', minHeight: '100vh',minWidth: '100vw'};
    return (
      <div className="container mt-1" style={containerStyle}>
        <h1>Success Stories</h1>
        <Form.Group className="d-flex align-items-center mb-3">
          <Select
            key={`headline-${filterKey}`}
            options={filterOptions}
            onChange={(option) => handleFilterChange(option, 'headline')}
            isClearable
            placeholder="Filter by headline..."
            className="me-2"
          />
          <Select
            key={`member-${filterKey}`}
            options={memberOptions}
            onChange={(option) => handleFilterChange(option, 'member')}
            isClearable
            placeholder="Filter by member..."
            className="me-2"
          />
          <Button variant="secondary" className="me-2 rounded shadow btn-md d-flex align-items-center" style={{ backgroundImage: 'linear-gradient(45deg, #007bff, #0056b3)' }} onClick={applyFilters}>
            <i className="fa-solid fa-filter me-1"></i> Filter
          </Button>
          <Button variant="outline-danger" onClick={handleClearFilter} className="ms-2">
            Clear
          </Button>
        </Form.Group>
        <Button
          variant="primary"
          onClick={handleAdd}
          className="mb-3 rounded shadow btn-md"
          style={{ backgroundImage: 'linear-gradient(45deg, #007bff, #0056b3)' }}
        >
          <i className="fa-solid fa-plus me-2"></i> Create New Story
        </Button>
        <Table bordered>
          <thead>
            <tr>
              <th>Date</th>
              <th>Headline</th>
              <th>Subheading</th>
              <th>Author</th>
              <th>Details</th>
              <th>Image</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>{renderStories()}</tbody>
        </Table>
        {paginator?.total_pages > 1 && <Paginate paginator={paginator} currentPage={currentPage} pagechanged={handlePageChange} />}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>{isEditing ? "Update Story" : "Create New Story"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleModalSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Date <span style={{ color: 'red' }}>*</span></Form.Label>
                <Form.Control
                  type="date"
                  value={modalData.date}
                  onChange={(e) => setModalData({ ...modalData, date: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Headline <span style={{ color: 'red' }}>*</span></Form.Label>
                <Form.Control
                  type="text"
                  value={modalData.headline}
                  onChange={(e) => setModalData({ ...modalData, headline: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Subheading <span style={{ color: 'red' }}>*</span></Form.Label>
                <Form.Control
                  type="text"
                  value={modalData.subheading}
                  onChange={(e) => setModalData({ ...modalData, subheading: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Details <span style={{ color: 'red' }}>*</span></Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={modalData.details}
                  onChange={(e) => setModalData({ ...modalData, details: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Member <span style={{ color: 'red' }}>*</span></Form.Label>
                <Select
                  options={memberOptions}
                  value={memberOptions.find(option => option.value === modalData.member_id)}
                  onChange={(selectedOption) => setModalData({ ...modalData, member_id: selectedOption ? selectedOption.value : null })}
                  isClearable
                  placeholder="Select a member..."
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Upload Image <span style={{ color: 'red' }}>*</span></Form.Label>
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
                <Form.Control type="file" onChange={(e) => handleFileUpload(e.target.files[0])} />
              </Form.Group>
              <Button type="submit">{isEditing ? "Update" : "Create"}</Button>
            </Form>
          </Modal.Body>
        </Modal>
  
        {/* Image Modal */}
        <Modal show={showImageModal} onHide={() => setShowImageModal(false)} size="lg" centered>
          <Modal.Header closeButton></Modal.Header>
          <Modal.Body className="d-flex justify-content-center">
            <img src={imageModalSrc} alt="Story" style={{ width: '100%', height: 'auto' }} />
          </Modal.Body>
        </Modal>
      </div>
    );
  };
  
  export default SuccessStories;