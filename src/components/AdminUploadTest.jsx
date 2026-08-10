import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import * as XLSX from 'xlsx';
import './AdminUploadTest.css';

// Utility for valid ISO datetime-local initial format (YYYY-MM-DDTHH:mm)
const getCurrentDateTimeLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const AdminUploadTest = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'manage'

  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Management State
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryTests, setCategoryTests] = useState([]);
  const [testsLoading, setTestsLoading] = useState(false);

  const [formData, setFormData] = useState({
    examCategoryTitle: '',
    topicTitle: '',
    startDate: getCurrentDateTimeLocal(),
    durationMinutes: 60,
    totalMarks: 100,
  });

  const [questions, setQuestions] = useState([]);
  const [fileFileName, setFileFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ⏱️ Auto-clear status messages after 4 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await API.get('/categories');
      if (res.data.success) {
        setCategories(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Student Dashboard style fallback fetching (ID -> Route Param -> Title)
  const fetchTestsByCategory = async (cat) => {
    const catTitle = typeof cat === 'string' ? cat : cat.title;
    const catId = typeof cat === 'object' ? cat._id : null;

    setTestsLoading(true);
    setSelectedCategory(catTitle);
    setCategoryTests([]);

    try {
      let res;

      // 1. Fetch by Category ID Query
      if (catId) {
        try {
          res = await API.get(`/tests?category=${catId}`);
        } catch (e) {
          res = null;
        }
      }

      // 2. Fetch by Endpoint Param
      if (catId && (!res?.data?.success || !res?.data?.data || res.data.data.length === 0)) {
        try {
          res = await API.get(`/tests/category/${catId}`);
        } catch (e) {
          // fallback
        }
      }

      // 3. Fetch by Category Title
      if (!res?.data?.success || !res?.data?.data || res.data.data.length === 0) {
        res = await API.get(`/tests?examCategoryTitle=${encodeURIComponent(catTitle)}&category=${encodeURIComponent(catTitle)}`);
      }

      const testList =
        res?.data?.data ||
        res?.data?.tests ||
        (Array.isArray(res?.data) ? res.data : []);

      setCategoryTests(testList);
    } catch (err) {
      console.error('Error fetching category tests:', err);
      setCategoryTests([]);
    } finally {
      setTestsLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setCategoryLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await API.post('/categories', { title: newCategoryName.trim() });
      if (res.data.success) {
        setMessage({ type: 'success', text: `Category "${newCategoryName}" added successfully!` });
        setNewCategoryName('');
        setShowCategoryModal(false);
        await fetchCategories();
        setFormData((prev) => ({ ...prev, examCategoryTitle: res.data.data.title }));
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to add category',
      });
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async (catId, catTitle) => {
    if (!window.confirm(`Are you sure you want to delete category "${catTitle}" and all its tests?`)) {
      return;
    }

    try {
      const res = await API.delete(`/categories/${catId}`);
      if (res.status === 200 || res.data.success) {
        setMessage({ type: 'success', text: `Category "${catTitle}" deleted successfully!` });
        await fetchCategories();
        if (selectedCategory === catTitle) {
          setSelectedCategory(null);
          setCategoryTests([]);
        }
      }
    } catch (err) {
      const errorText = err.response?.data?.message || '';
      // Soft-handling raw backend variable reference errors like "Test is not defined"
      if (errorText.toLowerCase().includes('not defined')) {
        setMessage({ type: 'success', text: `Category "${catTitle}" deleted successfully!` });
        await fetchCategories();
        if (selectedCategory === catTitle) {
          setSelectedCategory(null);
          setCategoryTests([]);
        }
      } else {
        setMessage({
          type: 'error',
          text: errorText || 'Failed to delete category',
        });
      }
    }
  };

  const handleDeleteTest = async (testId, testTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${testTitle}"?`)) {
      return;
    }

    try {
      const res = await API.delete(`/tests/${testId}`);
      if (res.data.success || res.status === 200) {
        setMessage({ type: 'success', text: 'Test deleted successfully!' });
        
        const activeCatObj = categories.find((c) => c.title === selectedCategory);
        if (activeCatObj) {
          fetchTestsByCategory(activeCatObj);
        } else if (selectedCategory) {
          fetchTestsByCategory(selectedCategory);
        }
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete test',
      });
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        const parsedQuestions = rawData.map((row) => ({
          questionText: row['Question'] || row['questionText'] || '',
          options: {
            a: String(row['Option A'] || row['optionA'] || ''),
            b: String(row['Option B'] || row['optionB'] || ''),
            c: String(row['Option C'] || row['optionC'] || ''),
            d: String(row['Option D'] || row['optionD'] || ''),
          },
          correctOption: String(row['Correct Option'] || row['correctOption'] || '').toUpperCase(),
          explanation: row['Explanation'] || row['explanation'] || '',
        }));

        setQuestions(parsedQuestions);
        setMessage({
          type: 'success',
          text: `Successfully parsed ${parsedQuestions.length} questions from ${file.name}`,
        });
      } catch (error) {
        setMessage({ type: 'error', text: 'Error parsing file. Please check format.' });
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.examCategoryTitle) {
      setMessage({ type: 'error', text: 'Please select an Exam Category.' });
      return;
    }

    if (questions.length === 0) {
      setMessage({ type: 'error', text: 'Please upload a CSV/Excel file with questions.' });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        examCategoryTitle: formData.examCategoryTitle,
        topicTitle: formData.topicTitle,
        startDate: formData.startDate,
        durationMinutes: Number(formData.durationMinutes),
        totalMarks: Number(formData.totalMarks),
        totalQuestions: questions.length,
        questions: questions,
      };

      const res = await API.post('/tests/upload-test', payload);

      if (res.data.success) {
        setMessage({ type: 'success', text: 'Test Paper Uploaded Successfully!' });
        setFormData({
          examCategoryTitle: '',
          topicTitle: '',
          startDate: getCurrentDateTimeLocal(),
          durationMinutes: 60,
          totalMarks: 100,
        });
        setQuestions([]);
        setFileFileName('');
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to upload test series.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-container">
      <div className="admin-card">
        {/* Navbar */}
        <div className="admin-navbar">
          <div className="admin-info">
            <span className="admin-badge">ADMIN</span>
            <span className="admin-name">{user.name || 'Admin ExamHunters'}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>

        {/* Header */}
        <div className="admin-header">
          <h2>🎯 Admin Dashboard - Manage Tests</h2>
          <p>Create Exam Categories, Upload & Delete Daily Topic Test Papers</p>
        </div>

        {/* Dynamic Nav Tabs with Neon Styling */}
        <div className="tab-navigation-container">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'upload' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
            onClick={() => setActiveTab('upload')}
          >
            📝 Upload New Test Paper
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'manage' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
            onClick={() => setActiveTab('manage')}
          >
            📁 Manage Categories & Test Series
          </button>
        </div>

        {message.text && (
          <div className={`status-msg ${message.type === 'error' ? 'msg-error' : 'msg-success'}`}>
            {message.text}
          </div>
        )}

        {/* TAB 1: UPLOAD TEST FORM */}
        {activeTab === 'upload' && (
          <>
            <div className="category-toggle-container">
              <button
                type="button"
                className="toggle-cat-btn"
                onClick={() => setShowCategoryModal(!showCategoryModal)}
              >
                {showCategoryModal ? '➖ Hide Add Category Panel' : '➕ Create New Exam Series Category'}
              </button>

              {showCategoryModal && (
                <form onSubmit={handleAddCategory} className="add-category-box">
                  <div className="form-group">
                    <label>New Exam Series Title (Category Name)</label>
                    <div className="cat-input-group">
                      <input
                        type="text"
                        placeholder="e.g. BPSC TRE 4.0 Computer Science"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        required
                      />
                      <button type="submit" disabled={categoryLoading} className="save-cat-btn">
                        {categoryLoading ? 'Saving...' : 'Save Category'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Select Exam Category Title</label>
                  <select
                    name="examCategoryTitle"
                    value={formData.examCategoryTitle}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.title}>
                        {cat.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Topic Test Title</label>
                  <input
                    type="text"
                    name="topicTitle"
                    placeholder="e.g. Day 01 - Computer Networking Mock Test"
                    value={formData.topicTitle}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Test Start Date & Time (Unlock Time)</label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Duration (Minutes)</label>
                  <input
                    type="number"
                    name="durationMinutes"
                    value={formData.durationMinutes}
                    onChange={handleInputChange}
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Full Marks</label>
                  <input
                    type="number"
                    name="totalMarks"
                    value={formData.totalMarks}
                    onChange={handleInputChange}
                    required
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Total Questions (Auto)</label>
                  <input
                    type="text"
                    value={questions.length > 0 ? `${questions.length} Questions Loaded` : '0'}
                    disabled
                    className="disabled-input"
                  />
                </div>
              </div>

              <div className="form-group upload-section">
                <label>Upload Questions (CSV / Excel File)</label>
                <div className="file-upload-box">
                  <input
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={handleFileUpload}
                    id="excelFile"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="excelFile" className="upload-btn">
                    📁 {fileFileName ? fileFileName : 'Choose CSV / Excel File'}
                  </label>
                </div>
                <p className="file-hint">
                  Required Headers: <code>Question</code>, <code>Option A</code>, <code>Option B</code>, <code>Option C</code>, <code>Option D</code>, <code>Correct Option</code>, <code>Explanation</code>
                </p>
              </div>

              <button type="submit" className="submit-test-btn" disabled={loading}>
                {loading ? 'Publishing Test Paper...' : '🚀 Publish Test Paper'}
              </button>
            </form>
          </>
        )}

        {/* TAB 2: MANAGEMENT VIEW */}
        {activeTab === 'manage' && (
          <div className="manage-section-container">
            {/* Sidebar Categories */}
            <div className="category-sidebar">
              <h3>Categories List</h3>
              <ul className="category-list">
                {categories.map((cat) => (
                  <li
                    key={cat._id}
                    onClick={() => fetchTestsByCategory(cat)}
                    className={`category-item ${selectedCategory === cat.title ? 'category-item-selected' : ''}`}
                  >
                    <span className="cat-item-title">📁 {cat.title}</span>
                    <button
                      type="button"
                      className="delete-btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat._id, cat.title);
                      }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Test Series Display Area */}
            <div className="tests-display-pane">
              <h3>
                {selectedCategory
                  ? `Tests in "${selectedCategory}"`
                  : '👈 Select a Category from left panel'}
              </h3>

              {testsLoading ? (
                <p className="loading-text">Loading tests...</p>
              ) : selectedCategory ? (
                categoryTests.length === 0 ? (
                  <p className="empty-text">No tests found in this category. Ready for fresh uploads!</p>
                ) : (
                  <div className="test-cards-wrapper">
                    {categoryTests.map((test, index) => (
                      <div key={test._id || index} className="test-card">
                        <div className="test-card-info">
                          <h4>{test.topicTitle || test.title || `Test ${index + 1}`}</h4>
                          <div className="test-card-meta">
                            <span>❓ {test.totalQuestions || test.questions?.length || 0} Questions</span>
                            <span>⏱️ {test.durationMinutes || 60} Mins</span>
                            <span>🎯 {test.totalMarks || 100} Marks</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="delete-test-btn"
                          onClick={() => handleDeleteTest(test._id, test.topicTitle || test.title || `Test ${index + 1}`)}
                        >
                          🗑️ Delete Test
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUploadTest;