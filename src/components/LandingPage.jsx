import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [authModal, setAuthModal] = useState(null); // 'login', 'register', 'forgot', or null
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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
      console.error('Error fetching landing categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // 🎯 Helper Function to Open Modal & Clear Messages
  const openAuthModal = (modalType, alertMessage = '') => {
    if (alertMessage) {
      setMessage({ type: 'error', text: alertMessage });
    } else {
      setMessage({ type: '', text: '' }); // डायरेक्ट लॉगिन/साइनअप पर मैसेज रिसेट करें
    }
    setAuthModal(modalType);
  };

  // 🎯 Modal Close Handler
  const closeAuthModal = () => {
    setAuthModal(null);
    setMessage({ type: '', text: '' }); // क्लोज करते समय मैसेज क्लियर करें
  };

  // Category Click Handler
  const handleCategoryClick = (categoryTitle) => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/student/dashboard');
    } else {
      openAuthModal(
        'login',
        `Please Log In or Register to access tests under "${categoryTitle}".`
      );
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      if (authModal === 'login') {
        const res = await API.post('/auth/login', {
          email: formData.email,
          password: formData.password,
        });

        if (res.data.success) {
          localStorage.setItem('token', res.data.data.token);
          localStorage.setItem('user', JSON.stringify(res.data.data));

          if (res.data.data.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/student/dashboard');
          }
        }
      } else if (authModal === 'register') {
        if (formData.password !== formData.confirmPassword) {
          setMessage({ type: 'error', text: 'Passwords do not match!' });
          setLoading(false);
          return;
        }

        const res = await API.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });

        if (res.data.success) {
          setMessage({ type: 'success', text: 'Registration Successful! Please Login.' });
          setTimeout(() => openAuthModal('login'), 1500);
        }
      } else if (authModal === 'forgot') {
        setMessage({
          type: 'success',
          text: 'Password reset link has been sent to your email.',
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Something went wrong. Try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-container">
      {/* Header Navigation */}
      <header className="landing-header">
        <div className="landing-logo">🎯 ExamHunters</div>
        <nav className="nav-links">
          <a href="#test-series">Exam Categories</a>
          <a href="#about">About Us</a>
          <a href="#vision">Vision</a>
          <a href="#career">Career Guide</a>
        </nav>
        <div className="header-auth-btns">
          <button className="btn-login-outline" onClick={() => openAuthModal('login')}>
            Log In
          </button>
          <button className="btn-signup-solid" onClick={() => openAuthModal('register')}>
            Sign Up
          </button>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>
            Crack Your Dream Govt Exam with <span>ExamHunters</span>
          </h1>
          <p>
            Topic-wise Daily Mock Tests, Detailed Explanations, Live Countdown Engine & Performance Analytics for BPSC & Competitive Exams.
          </p>
          <div className="hero-cta-group">
            <button className="btn-hero-primary" onClick={() => openAuthModal('register')}>
              🚀 Get Started For Free
            </button>
            <a href="#test-series" className="btn-hero-secondary">
              Explore Test Series ➔
            </a>
          </div>
        </div>
      </section>

      {/* FEATURED EXAM CATEGORIES SECTION */}
      <section id="test-series" className="section-padding">
        <h2 className="section-title">Available Exam Series</h2>
        <p className="sub-title-center" style={{ marginTop: '-20px', marginBottom: '30px' }}>
          Explore our active test categories. Click to attempt tests.
        </p>

        {categoriesLoading ? (
          <div className="loading-state">Loading Active Exam Categories...</div>
        ) : categories.length === 0 ? (
          <div className="empty-state">No categories published yet.</div>
        ) : (
          <div className="landing-cat-grid">
            {categories.map((cat) => (
              <div
                key={cat._id}
                className="landing-cat-card"
                onClick={() => handleCategoryClick(cat.title)}
              >
                <div className="cat-card-header">
                  <span className="cat-card-icon">📚</span>
                </div>
                <h3>{cat.title}</h3>
                <p>Daily Mock Tests, Date-wise Locked Schedules & Solutions</p>
                <button className="explore-cat-btn">Attempt Test Series ➔</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="section-padding bg-alt">
        <h2 className="section-title">Why ExamHunters Test Series?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Date-wise Mock Papers</h3>
            <p>Everyday new practice sets scheduled with live unlock timestamps.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⏱️</div>
            <h3>Real Exam Timer Engine</h3>
            <p>Simulate actual examination feel with question palette & countdown.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Instant Score & Analysis</h3>
            <p>Accuracy stats, correct vs wrong breakdown & PDF review downloads.</p>
          </div>
        </div>
      </section>

      {/* About & Vision Section */}
      <section id="about" className="section-padding">
        <div className="two-col-layout">
          <div>
            <h2 className="section-title text-left">About ExamHunters</h2>
            <p className="description-text">
              ExamHunters is a modern learning platform created to bridge the gap between preparation and success for competitive exam aspirants.
            </p>
          </div>
          <div id="vision">
            <h2 className="section-title text-left">Our Vision</h2>
            <p className="description-text">
              To empower every student with high-quality, structured test papers, instant feedback, and accessible digital learning resources.
            </p>
          </div>
        </div>
      </section>

      {/* Career Guidance */}
      <section id="career" className="section-padding bg-alt">
        <h2 className="section-title">Career & Exam Guidance</h2>
        <p className="sub-title-center">
          Structured guidance for BPSC TRE, Teacher Recruitment, IT Officers, and State Competitive Exams.
        </p>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2026 ExamHunters. All Rights Reserved.</p>
        <p className="credit-line">
          Designed & Developed by <strong>Nitesh Arya</strong>
        </p>
      </footer>

      {/* AUTH POPUP MODAL */}
      {authModal && (
        <div className="auth-modal-overlay">
          <div className="auth-modal-card">
            <button className="close-modal-btn" onClick={closeAuthModal}>
              ✕
            </button>

            <div className="modal-brand">🎯 ExamHunters</div>

            {message.text && (
              <div className={`status-msg ${message.type === 'error' ? 'msg-error' : 'msg-success'}`}>
                {message.text}
              </div>
            )}

            {/* LOGIN FORM */}
            {authModal === 'login' && (
              <form onSubmit={handleAuthSubmit} className="auth-form">
                <h3>Welcome Back!</h3>
                <p className="auth-sub">Log in to access your test dashboard</p>

                <div className="input-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="forgot-link-box">
                  <span onClick={() => openAuthModal('forgot')}>Forgot Password?</span>
                </div>

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? 'Logging in...' : 'Sign In'}
                </button>

                <p className="switch-auth-text">
                  Don't have an account?{' '}
                  <span onClick={() => openAuthModal('register')}>Register Here</span>
                </p>
              </form>
            )}

            {/* REGISTER FORM */}
            {authModal === 'register' && (
              <form onSubmit={handleAuthSubmit} className="auth-form">
                <h3>Create Account</h3>
                <p className="auth-sub">Start your exam preparation journey</p>

                <div className="input-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Create password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? 'Registering...' : 'Register Account'}
                </button>

                <p className="switch-auth-text">
                  Already have an account?{' '}
                  <span onClick={() => openAuthModal('login')}>Sign In Here</span>
                </p>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {authModal === 'forgot' && (
              <form onSubmit={handleAuthSubmit} className="auth-form">
                <h3>Reset Password</h3>
                <p className="auth-sub">Enter your email to receive password reset link</p>

                <div className="input-group">
                  <label>Registered Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter registered email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  Send Reset Link
                </button>

                <p className="switch-auth-text">
                  Back to{' '}
                  <span onClick={() => openAuthModal('login')}>Sign In</span>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;