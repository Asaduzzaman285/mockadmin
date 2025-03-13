import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Spinner } from 'react-bootstrap';
import axios from 'axios';
import Select from 'react-select';
import Paginate from './Paginate';

const EventPage = ({sidebarVisible}) => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedTitle, setSelectedTitle] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [eventsPerPage] = useState(10);
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
    title: "",
    artist: "",
    date: "",
    description: "",
    location: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [visibleUpdateButtons, setVisibleUpdateButtons] = useState({});
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalSrc, setImageModalSrc] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const API_BASE_URL = "https://adminapi.lyricistsassociationbd.com";

  useEffect(() => {
    fetchEvents();
  }, [currentPage]);

  const fetchEvents = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No authentication token found");
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/events/list-paginate?page=${currentPage}&per_page=${eventsPerPage}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = response.data;
      if (result.status === "success") {
        setEvents(result.data.data);
        setFilteredEvents(result.data.data);
        setPaginator(result.data.paginator);
      } else {
        console.error("Failed to fetch events:", result.message);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error("Unauthenticated. Clearing token and redirecting.");
        localStorage.removeItem("authToken");
        alert("Session expired. Please log in again.");
        window.location.href = "/login";
      } else {
        console.error("Error fetching events:", error);
      }
    }
  };

  const handleTitleFilterChange = (selectedOption) => {
    setSelectedTitle(selectedOption);
  };

  const handleArtistFilterChange = (selectedOption) => {
    setSelectedArtist(selectedOption);
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  const handleFilter = () => {
    let filtered = [...events];
    
    // Filter by title
    if (selectedTitle) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(selectedTitle.label.toLowerCase())
      );
    }
    
    // Filter by artist
    if (selectedArtist) {
      filtered = filtered.filter(event => 
        event.artist.toLowerCase().includes(selectedArtist.label.toLowerCase())
      );
    }
    
    // Filter by date range
    if (startDate && !endDate) {
      filtered = filtered.filter(event => event.date >= startDate);
    } else if (!startDate && endDate) {
      filtered = filtered.filter(event => event.date <= endDate);
    } else if (startDate && endDate) {
      filtered = filtered.filter(event => 
        event.date >= startDate && event.date <= endDate
      );
    }
    
    setFilteredEvents(filtered);
    setCurrentPage(1);
  };

  const handleClearFilter = () => {
    setSelectedTitle(null);
    setSelectedArtist(null);
    setStartDate('');
    setEndDate('');
    setFilteredEvents(events);
    setCurrentPage(1);
  };

  const handleAdd = () => {
    setModalData({
      image: null,
      title: "",
      artist: "",
      date: "",
      description: "",
      location: "",
    });
    setIsEditing(false);
    setEditingEventId(null);
    setShowModal(true);
  };

  const handleEdit = (event) => {
    const correctedFilePath = event.file_path ? `${API_BASE_URL}${event.file_path.replace('//', '/')}` : null;
  
    setModalData({
      image: correctedFilePath,
      title: event.title,
      artist: event.artist,
      date: event.date,
      description: event.description,
      location: event.location,
    });
    setIsEditing(true);
    setEditingEventId(event.id);
    setShowModal(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
  
    const fileName = file.name.split('.')[0];
    const filePath = `uploads/modules/events/`;
  
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
    const { title, artist, date, description, location, image } = modalData;
  
    const apiEndpoint = isEditing
      ? `${API_BASE_URL}/api/v1/events/update`
      : `${API_BASE_URL}/api/v1/events/create`;
  
    const payload = {
      id: editingEventId,
      title,
      artist,
      date,
      description,
      location,
      file_path: image ? image.replace(API_BASE_URL, '') : modalData.image,
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
        fetchEvents();
        setShowModal(false);
        setEditingEventId(null);
      } else {
        console.error("Failed to save event:", result.message);
      }
    } catch (error) {
      console.error("Error saving event:", error);
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
  const renderEventRows = () => {
    return filteredEvents.map((event) => {
      const correctedFilePath = event.file_path ? `${API_BASE_URL}${event.file_path.replace('//', '/')}` : "";

      return (
        <tr key={event.id}>
          <td>
            <img
              src={correctedFilePath}
              alt={event.title}
              style={{ width: "50px", height: "50px", objectFit: "cover", cursor: 'pointer' }}
              onClick={() => handleImageClick(correctedFilePath)}
            />
          </td>
          <td>{event.title}</td>
          <td>{event.artist}</td>
          <td>{event.date}</td>
          <td>{event.description}</td>
          <td>{event.location}</td>
          <td className="text-center">
            <Button variant="link" onClick={() => handleEdit(event)}>
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
      <h1>Events</h1>
      <div className="row mb-3">
        <div className="col-md-6">
          <Select
            className="mb-2"
            placeholder="Search by title..."
            value={selectedTitle}
            onChange={handleTitleFilterChange}
            options={Array.from(new Set(events.map(event => event.title)))
              .map(title => ({ value: title, label: title }))}
            isClearable
          />
        </div>
        <div className="col-md-6">
          <Select
            className="mb-2"
            placeholder="Search by artist..."
            value={selectedArtist}
            onChange={handleArtistFilterChange}
            options={Array.from(new Set(events.map(event => event.artist)))
              .map(artist => ({ value: artist, label: artist }))}
            isClearable
          />
        </div>
      </div>
      <div className="row mb-3">
        <div className="col-md-4">
          <Form.Group>
            <Form.Control
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={handleStartDateChange}
            />
          </Form.Group>
        </div>
        <div className="col-md-4">
          <Form.Group>
            <Form.Control
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={handleEndDateChange}
            />
          </Form.Group>
        </div>
        <div className="col-md-4 d-flex align-items-center">
          <Button
            variant="secondary"
            className="me-2 rounded shadow btn-md d-flex align-items-center justify-content-between"
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
      <Button
        variant="primary"
        onClick={handleAdd}
        className="mb-3 rounded shadow btn-md"
        style={{ backgroundImage: 'linear-gradient(45deg, #007bff, #0056b3)' }}
      >
        <i className="fa-solid fa-plus me-2"></i> Create New Event
      </Button>
      <Table bordered>
        <thead>
          <tr>
            <th>Image</th>
            <th>Title</th>
            <th>Artist</th>
            <th>Date</th>
            <th>Description</th>
            <th>Location</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>{renderEventRows()}</tbody>
      </Table>
      {paginator?.total_pages > 1 && renderPagination()}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? "Update Event" : "Create New Event"}
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
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={modalData.title}
                onChange={(e) =>
                  setModalData({ ...modalData, title: e.target.value })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Artist</Form.Label>
              <Form.Control
                type="text"
                value={modalData.artist}
                onChange={(e) =>
                  setModalData({ ...modalData, artist: e.target.value })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={modalData.date}
                onChange={(e) =>
                  setModalData({ ...modalData, date: e.target.value })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
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
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                value={modalData.location}
                onChange={(e) =>
                  setModalData({ ...modalData, location: e.target.value })
                }
                required
              />
            </Form.Group>

            <div className="text-end">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Close
              </Button>
              <Button type="submit" variant="primary" className="ms-2">
                {isEditing ? "Update Event" : "Create Event"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Image Modal */}
      <Modal className='ms-5' show={showImageModal} onHide={() => setShowImageModal(false)} size="lg" centered>
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body className="d-flex justify-content-center">
          <img src={imageModalSrc} alt="Event" style={{ width: '100%', height: 'auto' }} />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default EventPage;