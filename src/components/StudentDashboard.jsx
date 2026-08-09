import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await API.get('/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      setError('Failed to load exam categories.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  return (
    <div className="student-container">
      <div className="student-nav">
        <div className="brand-title">🎯 ExamHunters</div>
        <div className="user-profile">
          <span title={user.name}>
            Welcome, <strong>{user.name ? user.name.split(' ')[0] : 'Student'}</strong>
          </span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="student-content">
        <h2>Select Exam Series</h2>
        <p className="sub-heading">Choose a category to view all available daily mock tests</p>

        {loading ? (
          <div className="loading-state">Loading Exam Categories...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : categories.length === 0 ? (
          <div className="empty-state">No exam categories available yet.</div>
        ) : (
          <div className="category-grid">
            {categories.map((cat) => (
              <div
                key={cat._id}
                className="category-card"
                onClick={() => navigate(`/student/category/${cat._id}`, { state: { categoryTitle: cat.title } })}
              >
                <div className="card-icon">📝</div>
                <h3>{cat.title}</h3>
                <span className="explore-btn">View Test Series ➔</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;