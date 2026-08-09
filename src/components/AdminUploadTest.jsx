import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import * as XLSX from 'xlsx';
import './AdminUploadTest.css';

const AdminUploadTest = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false); // Toggle Switch for Category
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);

  const [formData, setFormData] = useState({
    examCategoryTitle: '',
    topicTitle: '',
    startDate: '',
    durationMinutes: 60,
    totalMarks: 100,
  });

  const [questions, setQuestions] = useState([]);
  const [fileFileName, setFileFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  // 1. Fetch Categories List
  const fetchCategories = async () => {
    try {
      const res = await API.get('/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // 2. Add Category Handler
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
        setShowCategoryModal(false); // Close Modal/Toggle
        await fetchCategories(); // Refresh Dropdown List
        setFormData({ ...formData, examCategoryTitle: res.data.data.title }); // Auto select newly created category
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
          startDate: '',
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
        {/* Header Bar */}
        <div className="admin-navbar">
          <div className="admin-info">
            <span className="admin-badge">ADMIN</span>
            <span className="admin-name">{user.name || 'Admin'}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Logout
          </button>
        </div>

        <div className="admin-header">
          <h2>🎯 Admin Dashboard - Manage Tests</h2>
          <p>Create Exam Categories & Upload Daily Topic Test Papers</p>
        </div>

        {message.text && (
          <div className={`status-msg ${message.type === 'error' ? 'msg-error' : 'msg-success'}`}>
            {message.text}
          </div>
        )}

        {/* TOGGLE SECTION: ADD CATEGORY PANEL */}
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

        {/* MAIN UPLOAD TEST FORM */}
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
      </div>
    </div>
  );
};

export default AdminUploadTest;