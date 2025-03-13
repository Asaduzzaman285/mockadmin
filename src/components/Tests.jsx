import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Table, Spinner, Alert, Breadcrumb, Row, Col, Badge, Card } from 'react-bootstrap';
import axios from 'axios';
import Paginate from './Paginate';
import { useNavigate, Link } from 'react-router-dom';
import Select from 'react-select';
import './test.css';
const Tests = ({ sidebarVisible }) => {
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [testsPerPage] = useState(10);
  const [paginator, setPaginator] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    title: "",
    desc: "",
    file_path: "",
    no_of_ques: 0,
    price: 0
  });
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [selectedTestData, setSelectedTestData] = useState(null);
  const [questionFile, setQuestionFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);
  const [expandedTestId, setExpandedTestId] = useState(null);
  const [showFileModal, setShowFileModal] = useState(false);
  const [fileModalSrc, setFileModalSrc] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingQuestions, setUploadingQuestions] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [allTests, setAllTests] = useState([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  // New state variables from the updated version
  const [testQuestions, setTestQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'questions'
  
  const navigate = useNavigate();
  const API_BASE_URL = "https://mocktestadminapi.lyricistsassociationbd.com";
  const fileRef = useRef(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!authError) {
      fetchTests();
    }
  }, [currentPage, authError]);

  useEffect(() => {
    if (tests.length > 0) {
      filterTests();
    }
  }, [selectedTest, tests]);

  const filterTests = () => {
    if (selectedTest) {
      setFilteredTests(tests.filter(test => test.id === selectedTest.value));
    } else {
      setFilteredTests(tests);
    }
  };

  const checkAuth = () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setAuthError(true);
      setIsLoading(false);
      navigate('/login');
      return false;
    }
    return true;
  };

  const fetchTests = async () => {
    if (!checkAuth()) return;
    
    setTableLoading(true);
    const token = localStorage.getItem("authToken");
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/mock-test/list-paginate?page=${currentPage}&per_page=${testsPerPage}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = response.data;
      if (result.status === "success") {
        setTests(result.data.data);
        setFilteredTests(result.data.data);
        setPaginator(result.data.paginator);
        setAuthError(false);
        
        // Get all tests for the select options
        if (allTests.length === 0) {
          fetchAllTests();
        }
      }
    } catch (error) {
      console.error("Error fetching tests:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        setAuthError(true);
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
      setTableLoading(false);
    }
  };

  const fetchAllTests = async () => {
    if (!checkAuth()) return;
    
    const token = localStorage.getItem("authToken");
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/mock-test/list-paginate`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = response.data;
      if (result.status === "success") {
        const options = result.data.map(test => ({
          value: test.id,
          label: test.title
        }));
        setAllTests(options);
      }
    } catch (error) {
      console.error("Error fetching all tests:", error);
    }
  };

  // New function from the updated version
  const fetchSingleTest = async (testId) => {
    if (!checkAuth()) return;
    
    const token = localStorage.getItem("authToken");
    setIsLoadingQuestions(true);
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/mock-test/single-data/${testId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status === "success") {
        const testData = response.data.data;
        setSelectedTestData(testData);
        setTestQuestions(testData.mock_test_ques || []);
        setModalData({
          title: testData.title,
          desc: testData.desc,
          file_path: testData.file_path,
          no_of_ques: testData.no_of_ques,
          price: testData.price
        });
      }
    } catch (error) {
      console.error("Error fetching test details:", error);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // New function from the updated version
  const handleClearQuestions = async () => {
    if (!checkAuth() || !selectedTestId) return;
    
    const token = localStorage.getItem("authToken");
    setIsClearing(true);
    
    try {
      await axios.post(
        `${API_BASE_URL}/api/v1/mock-test/questions-clear`,
        { mock_test_id: selectedTestId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setTestQuestions([]);
      setUploadSuccess(false);
      await fetchSingleTest(selectedTestId);
    } catch (error) {
      console.error("Error clearing questions:", error);
    } finally {
      setIsClearing(false);
    }
  };

  // New function from the updated version
  const handleDeleteQuestion = async (questionId) => {
    if (!checkAuth()) return;
    
    const token = localStorage.getItem("authToken");
    setIsDeletingQuestion(true);
    
    try {
      await axios.post(
        `${API_BASE_URL}/api/v1/mock-test/single-question-delete`,
        { mock_test_ques_id: questionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      await fetchSingleTest(selectedTestId);
    } catch (error) {
      console.error("Error deleting question:", error);
    } finally {
      setIsDeletingQuestion(false);
    }
  };

  const handleFileClick = (src) => {
    setFileModalSrc(src);
    setShowFileModal(true);
  };

  const handleFileUpload = async (file) => {
    if (!checkAuth() || !file) return;
    
    const token = localStorage.getItem("authToken");
    const formData = new FormData();
    formData.append("file", file);
    const fileName = file.name.split('.')[0];
    const filePath = "uploads/modules/general/";
    
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
          params: { file_name: fileName, file_path: filePath }
        }
      );
      
      if (response.data.status === "success") {
        // Fix the path that already contains incorrect structure
        let returnedPath = response.data.data.file_path;
        
        // Remove any leading slashes
        if (returnedPath.startsWith('/')) {
          returnedPath = returnedPath.substring(1);
        }
        
        // Create the final path with the API base URL
        const uploadedPath = `${API_BASE_URL}/${returnedPath}`;
        
        setModalData(prev => ({ ...prev, file_path: uploadedPath }));
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        setAuthError(true);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Updated from the newer version
  const handleQuestionFileUpload = async () => {
    if (!checkAuth() || !questionFile || !selectedTestId) return;
    
    const token = localStorage.getItem("authToken");
    const formData = new FormData();
    formData.append("question_file", questionFile);
    formData.append("mock_test_id", selectedTestId);
    
    try {
      setUploadingQuestions(true);
      setUploadError('');
      setUploadSuccess(false);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/mock-test/add-questions`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          }
        }
      );
      
      if (response.data.status === "success") {
        setUploadSuccess(true);
        await fetchSingleTest(selectedTestId);
      }
    } catch (error) {
      console.error("Error uploading questions:", error);
      setUploadError('Failed to upload questions. Please try again.');
      if (error.response?.status === 401 || error.response?.status === 403) {
        setAuthError(true);
      }
    } finally {
      setUploadingQuestions(false);
    }
  };

  const handleAdd = () => {
    if (!checkAuth()) return;
    
    setModalData({
      title: "",
      desc: "",
      file_path: "",
      no_of_ques: 0,
      price: 0
    });
    setIsEditing(false);
    setEditingTestId(null);
    setShowModal(true);
  };

  const handleEdit = (test) => {
    if (!checkAuth()) return;
    
    // Properly format the file path
    const correctedFilePath = test.file_path.startsWith('http') 
      ? test.file_path 
      : `${API_BASE_URL}${test.file_path.replace('//', '/')}`;
    
    setModalData({
      title: test.title,
      desc: test.desc,
      file_path: correctedFilePath,
      no_of_ques: test.no_of_ques,
      price: test.price
    });
    setIsEditing(true);
    setEditingTestId(test.id);
    setShowModal(true);
  };

  // Updated from the newer version
  const handleUpdate = async (test) => {
    if (!checkAuth()) return;
    setSelectedTestId(test.id);
    setQuestionFile(null);
    setUploadSuccess(false);
    setUploadError('');
    setActiveTab('details');
    await fetchSingleTest(test.id);
    setUpdateModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!checkAuth()) return;
    
    const token = localStorage.getItem("authToken");
    const apiEndpoint = isEditing
      ? `${API_BASE_URL}/api/v1/mock-test/update`
      : `${API_BASE_URL}/api/v1/mock-test/create`;
    
    try {
      setIsSaving(true);
      // Ensure file_path is properly formatted for the API
      let formattedFilePath = modalData.file_path;
      if (formattedFilePath.startsWith(API_BASE_URL)) {
        formattedFilePath = formattedFilePath.replace(API_BASE_URL, '');
      }
      
      await axios({
        url: apiEndpoint,
        method: isEditing ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        data: {
          ...modalData,
          id: isEditing ? editingTestId : undefined,
          file_path: formattedFilePath,
          no_of_ques: parseInt(modalData.no_of_ques),
          price: parseFloat(modalData.price)
        }
      });
      fetchTests();
      setShowModal(false);
    } catch (error) {
      console.error("Error saving test:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        setAuthError(true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearFilter = () => {
    setSelectedTest(null);
  };

  // New function from the updated version
  const renderQuestions = () => {
    return testQuestions.map((question, index) => (
      <Card key={question.id} className="mb-3 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div className="d-flex align-items-center gap-2">
              <Badge bg="secondary" className="rounded-pill">Q{index + 1}</Badge>
              <span className="text-primary small">
                {question.mock_test_quest_type?.title || "Single Answer"}
              </span>
            </div>
            <Button
              variant="outline-danger"
              size="sm"
              className="rounded-pill px-2 py-0"
              onClick={() => handleDeleteQuestion(question.id)}
              disabled={isDeletingQuestion}
            >
              <i className="fa-solid fa-trash-can"></i>
            </Button>
          </div>

          <p className="mb-3">{question.question_text}</p>

          <div className="ps-3">
            {question.mock_test_ques_options?.map((option) => (
              <div
                key={option.id}
                className={`p-2 rounded mb-2 ${
                  option.is_answer ? 'bg-success bg-opacity-10' : ''
                }`}
              >
                <i className={`fa-regular ${
                  option.is_answer ? 'fa-circle-check text-success' : 'fa-circle'
                } me-2`}></i>
                {option.title}
              </div>
            ))}
          </div>

          {question.answer_detail && (
            <div className="mt-3 pt-2 border-top">
              <small className="text-muted">
                <i className="fa-solid fa-circle-info me-2"></i>
                {question.answer_detail}
              </small>
            </div>
          )}
        </Card.Body>
      </Card>
    ));
  };

  const containerStyle = {
    padding: sidebarVisible ? '80px 0% 0 15%' : '80px 0% 0 0%',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    transition: 'all 0.3s ease',
  };

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

  const renderTests = () => {
    return filteredTests.map((test) => {
      const correctedFilePath = test.file_path ? 
        (test.file_path.startsWith('http') ? test.file_path : `${API_BASE_URL}${test.file_path.replace('//', '/')}`) : "";
      const isExpanded = expandedTestId === test.id;
      const testDesc = isExpanded ? test.desc : 
        `${test.desc.substring(0, 100)}${test.desc.length > 100 ? '...' : ''}`;

      return (
        <tr key={test.id} className="align-middle">
        <td className="fw-light text-secondary ps-4">
          {new Date(test.created_at).toLocaleDateString()}
        </td>
        <td className="fw-semibold text-primary">{test.title}</td>
        <td style={{ maxWidth: '200px' }}>
          <p className="mb-0 text-muted">{testDesc}</p>
          {test.desc.length > 100 && (
            <Button
              variant="link"
              className="text-decoration-none p-0 text-info small"
              onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </Button>
          )}
        </td>
        <td className="text-success fw-medium">${test.price}</td>
        <td>
          {correctedFilePath && (
            <Button
              variant="outline-primary"
              size="sm"
              className="d-flex align-items-center gap-1 border-0"
              onClick={() => handleFileClick(correctedFilePath)}
            >
              <i className="fa-regular fa-image"></i>
              <span className="small">View</span>
            </Button>
          )}
        </td>
        <td className="text-center">
          <div className="d-flex gap-2 justify-content-center">
            <Button
              variant="outline-warning"
              size="sm"
              onClick={() => handleEdit(test)}
              className="px-2 py-1 rounded-2 border-0"
              title="Edit Test"
            >
              <i className="fa-solid fa-pen-to-square text-dark"></i>
            </Button>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => handleUpdate(test)}
              className="px-2 py-1 rounded-2 border-0"
              title="Manage Test"
            >
              <i className="fa-solid fa-file-arrow-up text-primary"></i>
            </Button>
          </div>
        </td>
      </tr>
      );
    });
  };

  // New function from the updated version - rendering update modal
  const renderUpdateModal = () => (

<Modal 
  show={updateModalOpen} 
  onHide={() => setUpdateModalOpen(false)} 
  size="xl" 
  dialogClassName="custom-modal" 

  centered
>

      <Modal.Header closeButton className="bg-primary bg-opacity-10">
        <Modal.Title className="fs-5 text-primary">
          Manage Test: {selectedTestData?.title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <div className="border-bottom">
          <div className="d-flex">
            <Button
              variant={activeTab === 'details' ? 'primary' : 'light'}
              className="rounded-0 flex-grow-1 py-2"
              onClick={() => setActiveTab('details')}
            >
              Test Details
            </Button>
            <Button
              variant={activeTab === 'questions' ? 'primary' : 'light'}
              className="rounded-0 flex-grow-1 py-2"
              onClick={() => setActiveTab('questions')}
            >
              Questions
            </Button>
          </div>
        </div>

        <div className="p-4">
          {activeTab === 'details' ? (
            <Form onSubmit={handleModalSubmit}>
              <Row className="mb-3">
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium small text-secondary">Test Title</Form.Label>
                    <Form.Control
                      required
                      size="sm"
                      value={modalData.title}
                      onChange={(e) => setModalData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium small text-secondary">Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      required
                      rows={3}
                      size="sm"
                      value={modalData.desc}
                      onChange={(e) => setModalData(prev => ({ ...prev, desc: e.target.value }))}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium small text-secondary">Image</Form.Label>
                    {modalData.file_path && (
                      <div className="mb-2">
                        <img
                          src={modalData.file_path}
                          alt="Test"
                          className="img-fluid rounded"
                        />
                      </div>
                    )}
                    <Form.Control
                      type="file"
                      accept="image/*"
                      size="sm"
                      onChange={(e) => handleFileUpload(e.target.files[0])}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-3 mb-4">
                {/* <Col md={6}>
                  <Form.Label className="fw-medium small text-secondary">Number of Questions</Form.Label>
                  <Form.Control
                    type="number"
                    required
                    size="sm"
                    value={modalData.no_of_ques}
                    onChange={(e) => setModalData(prev => ({ ...prev, no_of_ques: e.target.value }))}
                  />
                </Col> */}
                <Col md={6}>
                  <Form.Label className="fw-medium small text-secondary">Price ($)</Form.Label>
                  <Form.Control
                    type="number"
                    required
                    size="sm"
                    value={modalData.price}
                    onChange={(e) => setModalData(prev => ({ ...prev, price: e.target.value }))}
                  />
                </Col>
              </Row>

              <div className="d-flex justify-content-end">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="px-4"
                  size="sm"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </Form>
          ) : (
            <div>
              <div className="mb-4">
                <Form.Group>
                  <Form.Label className="fw-medium small text-secondary">Upload Questions (XLSX)</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="file"
                      accept=".xlsx, .xls"
                      size="sm"
                      onChange={(e) => setQuestionFile(e.target.files[0])}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleQuestionFileUpload}
                      disabled={!questionFile || uploadingQuestions}
                    >
                      {uploadingQuestions ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        <i className="fa-solid fa-upload"></i>
                      )}
                    </Button>
                  </div>
                </Form.Group>

                {uploadSuccess && (
                  <Alert variant="success" className="mt-3 py-2">
                    <i className="fa-solid fa-check-circle me-2"></i>
                    Questions uploaded successfully!
                  </Alert>
                )}

                {uploadError && (
                  <Alert variant="danger" className="mt-3 py-2">
                    <i className="fa-solid fa-exclamation-circle me-2"></i>
                    {uploadError}
                  </Alert>
                )}
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">
                  Questions ({testQuestions.length})
                </h6>
                {testQuestions.length > 0 && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="rounded-pill px-3"
                    onClick={handleClearQuestions}
                    disabled={isClearing}
                  >
                    {isClearing ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <>
                        <i className="fa-solid fa-trash-can me-1"></i>
                        Clear All
                      </>
                    )}
                  </Button>
                )}
              </div>

              {isLoadingQuestions ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2 text-muted">Loading questions...</p>
                </div>
              ) : testQuestions.length === 0 ? (
                <Alert variant="info">
                  <i className="fa-solid fa-info-circle me-2"></i>
                  No questions available. Upload an Excel file to add questions.
                </Alert>
              ) : (
                <div className="questions-list">
                  {renderQuestions()}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
  if (authError) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Alert variant="danger" className="w-50 text-center shadow-sm">
          <Alert.Heading className="fs-5">Session Expired</Alert.Heading>
          <p className="mb-3">Please login to continue</p>
          <Button 
            onClick={() => navigate('/login')} 
            variant="danger" 
            className="px-4 py-1 rounded-pill"
          >
            Go to Login
          </Button>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner 
          animation="border" 
          variant="primary" 
          style={{ width: '3rem', height: '3rem' }}
        />
      </div>
    );
  }
  return (
    <div style={containerStyle}>
      <div className="px-4">
        <div className="mb-3 pb-2 border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="fw-semibold text-primary mb-2 fs-4">
              <i className="fa-solid fa-file-circle-check me-2"></i>
              Mock Tests
            </h2>
            <Breadcrumb className="fs-7">
              <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Dashboard</Breadcrumb.Item>
              <Breadcrumb.Item active>Mock Tests</Breadcrumb.Item>
            </Breadcrumb>
          </div>

          {/* Filters and Add Button */}
          <div className="d-flex flex-wrap gap-3">
            <div className="d-flex align-items-center" style={{ width: '280px' }}>
              <div style={{ flex: 1 }}>
                <Select
                  options={allTests}
                  value={selectedTest}
                  onChange={setSelectedTest}
                  placeholder="Select a test..."
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
                  onClick={filterTests}
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
                  disabled={!selectedTest}
                >
                  <i className="fa-solid fa-xmark"></i>
                </Button>
              </div>
            </div>
          </div>

          {/* Add Button */}
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
    
          {/* Tests Table */}
          <div className="bg-white rounded-3 shadow-sm overflow-hidden">
            {tableLoading ? (
              <div className="d-flex justify-content-center align-items-center py-5">
                <Spinner animation="border" variant="primary" />
                <span className="ms-3 text-muted">Loading tests...</span>
              </div>
            ) : filteredTests.length === 0 ? (
              <Alert variant="info" className="m-3 rounded-3 shadow-sm">
                <i className="fa-solid fa-info-circle me-2"></i>
                {selectedTest ? "No tests match your filter. Please try another selection." : "No tests found. Create your first mock test to get started."}
              </Alert>
            ) : (
              <Table hover responsive className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 text-secondary small">DATE</th>
                    <th className="text-secondary small">TITLE</th>
                    <th className="text-secondary small">DESCRIPTION</th>
                
                    <th className="text-secondary small">PRICE</th>
                    <th className="text-secondary small">IMAGE</th>
                    <th className="text-center text-secondary small">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="border-top">{renderTests()}</tbody>
              </Table>
            )}
          </div>
    
          {/* Pagination */}
          {!tableLoading && paginator?.total_pages > 1 && (
            <div className="mt-4 d-flex justify-content-center">
              <Paginate
                paginator={paginator}
                currentPage={currentPage}
                pagechanged={setCurrentPage}
              />
            </div>
          )}
    
          {/* Create/Edit Modal */}
          <Modal show={showModal} onHide={() => setShowModal(false)} centered>
            <Modal.Header closeButton className="bg-primary bg-opacity-10 border-bottom-0">
              <Modal.Title className="fs-5 text-primary">
                {isEditing ? "Edit Test Details" : "Create New Test"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 pb-4 pt-2">
              <Form onSubmit={handleModalSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium small text-secondary">Test Title</Form.Label>
                  <Form.Control
                    required
                    size="sm"
                    className="rounded-2 border-light-subtle"
                    value={modalData.title}
                    onChange={(e) => setModalData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </Form.Group>
    
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium small text-secondary">Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    required
                    rows={3}
                    size="sm"
                    className="rounded-2 border-light-subtle"
                    value={modalData.desc}
                    onChange={(e) => setModalData(prev => ({ ...prev, desc: e.target.value }))}
                  />
                </Form.Group>
    
                <Row className="g-3 mb-3">
             
                  <Col md={6}>
                    <Form.Label className="fw-medium small text-secondary">Price ($)</Form.Label>
                    <Form.Control
                      type="number"
                      required
                      size="sm"
                      className="rounded-2 border-light-subtle"
                      value={modalData.price}
                      onChange={(e) => setModalData(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </Col>
                </Row>
    
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium small text-secondary d-flex align-items-center">
                    Image
                    {modalData.file_path && (
                      <Button 
                        variant="link" 
                        className="ms-2 p-0 text-primary small"
                        onClick={() => handleFileClick(modalData.file_path)}
                      >
                        <i className="fa-regular fa-image me-1"></i>
                        View Current
                      </Button>
                    )}
                  </Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    size="sm"
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                    className="rounded-2 border-light-subtle"
                    ref={fileRef}
                  />
                  {isUploading && (
                    <div className="mt-2 text-secondary small">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Uploading...
                    </div>
                  )}
                </Form.Group>
    
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <Button 
                    variant="light" 
                    onClick={() => setShowModal(false)}
                    className="rounded-pill px-3 py-1 border"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    className="rounded-pill px-3 py-1"
                    size="sm"
                    disabled={isUploading}
                  >
                    {isEditing ? "Save Changes" : "Create Test"}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>
    
          {/* Questions Management Modal */}
          <Modal 
  show={updateModalOpen} 
  onHide={() => setUpdateModalOpen(false)} 
  size="lg"
  centered
>
  <Modal.Header closeButton className="bg-primary bg-opacity-10">
    <Modal.Title className="fs-5 text-primary">
      Manage Test: {selectedTestData?.title}
    </Modal.Title>
  </Modal.Header>
  <Modal.Body className="p-0">
    <div className="border-bottom">
      <div className="d-flex">
        <Button
          variant={activeTab === 'details' ? 'primary' : 'light'}
          className="rounded-0 flex-grow-1 py-2"
          onClick={() => setActiveTab('details')}
        >
          Test Details
        </Button>
        <Button
          variant={activeTab === 'questions' ? 'primary' : 'light'}
          className="rounded-0 flex-grow-1 py-2"
          onClick={() => setActiveTab('questions')}
        >
          Questions
        </Button>
      </div>
    </div>

    
      {activeTab === 'details' ? (
        <Form onSubmit={handleModalSubmit}>
          <Row className="mb-3">
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-medium small text-secondary">Test Title</Form.Label>
                <Form.Control
                  required
                  size="sm"
                  value={modalData.title}
                  onChange={(e) => setModalData(prev => ({ ...prev, title: e.target.value }))}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-medium small text-secondary">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  required
                  rows={3}
                  size="sm"
                  value={modalData.desc}
                  onChange={(e) => setModalData(prev => ({ ...prev, desc: e.target.value }))}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-medium small text-secondary">Image</Form.Label>
                {modalData.file_path && (
                  <div className="mb-2">
                    <img
                      src={modalData.file_path}
                      alt="Test"
                      className="img-fluid rounded"
                    />
                  </div>
                )}
                <Form.Control
                  type="file"
                  accept="image/*"
                  size="sm"
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3 mb-4">
           
            <Col md={6}>
              <Form.Label className="fw-medium small text-secondary">Price ($)</Form.Label>
              <Form.Control
                type="number"
                required
                size="sm"
                value={modalData.price}
                onChange={(e) => setModalData(prev => ({ ...prev, price: e.target.value }))}
              />
            </Col>
          </Row>

          <div className="d-flex justify-content-end">
            <Button 
              type="submit" 
              variant="primary" 
              className="px-4"
              size="sm"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </Form>
      ) : (
        <div>
          <div className="mb-4 p-3 bg-light rounded border">
            <p className="mb-2">
              Please upload questions by attaching a '.xlsx' file (first tab only). Please 
              <strong> download </strong> 
              the file and follow the format below. You need to enter your information according to the format.
            </p>
            
            <div className="d-flex align-items-center mb-3">
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="d-flex align-items-center"
                href="/assets/templates/mock_test_add_questions.xlsx" 
                download
              >
                <i className="fa-solid fa-file-excel me-2"></i>
                Download Template
              </Button>
              <span className="ms-2 small text-muted">(mock_test_add_questions.xlsx)</span>
            </div>
     
          </div>

          <div className="mb-4">
            <Form.Group>
              <Form.Label className="fw-medium small text-secondary">Upload Questions (XLSX)</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="file"
                  accept=".xlsx, .xls"
                  size="sm"
                  onChange={(e) => setQuestionFile(e.target.files[0])}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleQuestionFileUpload}
                  disabled={!questionFile || uploadingQuestions}
                >
                  {uploadingQuestions ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <i className="fa-solid fa-upload"></i>
                  )}
                </Button>
              </div>
            </Form.Group>

            {uploadSuccess && (
              <Alert variant="success" className="mt-3 py-2">
                <i className="fa-solid fa-check-circle me-2"></i>
                Questions uploaded successfully!
              </Alert>
            )}

            {uploadError && (
              <Alert variant="danger" className="mt-3 py-2">
                <i className="fa-solid fa-exclamation-circle me-2"></i>
                {uploadError}
              </Alert>
            )}
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">
              Questions ({testQuestions.length})
            </h6>
            {testQuestions.length > 0 && (
              <Button
                variant="outline-danger"
                size="sm"
                className="rounded-pill px-3"
                onClick={handleClearQuestions}
                disabled={isClearing}
              >
                {isClearing ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <>
                    <i className="fa-solid fa-trash-can me-1"></i>
                    Clear All
                  </>
                )}
              </Button>
            )}
          </div>

          {isLoadingQuestions ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading questions...</p>
            </div>
          ) : testQuestions.length === 0 ? (
            <Alert variant="info">
              <i className="fa-solid fa-info-circle me-2"></i>
              No questions available. Upload an Excel file to add questions.
            </Alert>
          ) : (
            <div className="questions-list">
              {testQuestions.map((question, index) => (
                <Card key={question.id} className="mb-3 shadow-sm">
                  <Card.Body>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg="secondary" className="rounded-pill">Q{index + 1}</Badge>
                    <span className="text-primary small text-truncate" style={{ maxWidth: '400px' }}>
                      {question.question || "No question available"}
                    </span>
                  </div>

                    <p className="mb-3">{question.question_text}</p>

                    <div className="ps-3">
                      {question.mock_test_ques_options?.map((option) => (
                        <div
                          key={option.id}
                          className={`p-2 rounded mb-2 ${
                            option.is_answer ? 'bg-success bg-opacity-10' : ''
                          }`}
                        >
                         <i className={`fa-regular ${
                            option.is_answer ? 'fa-circle-check text-success' : 'fa-circle'
                          } me-2`}></i>
                          {option.title}
                        </div>
                      ))}
                    </div>

                    {question.answer_detail && (
                      <div className="mt-3 pt-2 border-top">
                        <small className="text-muted">
                          <i className="fa-solid fa-circle-info me-2"></i>
                          {question.answer_detail}
                        </small>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
  </Modal.Body>
</Modal>


{/* Image Preview Modal */}
<Modal show={showFileModal} onHide={() => setShowFileModal(false)} size="lg" centered>
<Modal.Header closeButton className="border-0 pb-0">
  <Modal.Title className="text-primary fs-6">Image Preview</Modal.Title>
</Modal.Header>
<Modal.Body className="p-0 text-center">
  <img 
    src={fileModalSrc} 
    className="img-fluid rounded-3 mb-3"
    alt="Test Image"
    style={{ maxHeight: '70vh' }}
  />
</Modal.Body>
</Modal>
</div>
</div>
);
};

export default Tests;

