import React, { useState, useEffect, useRef } from 'react';
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

  // 🚀 Slider State & Configuration
  const [currentSlide, setCurrentSlide] = useState(0);
  const autoPlayRef = useRef(null);

  const heroSlides = [
    {
      id: 1,
      title: (
        <>
          Crack Your Dream Exam with <span>ExamHunters</span>
        </>
      ),
      description:
        'Free Online Platform for Topic-wise Daily Mock Tests, Chapter Practice Sets, Live Countdown Engine & Detailed Performance Analytics.',
      primaryBtnText: '🚀 Get Started For Free',
      primaryBtnAction: () => openAuthModal('register'),
      secondaryBtnText: 'Explore Test Series ➔',
      secondaryBtnLink: '#test-series',
    },
    {
      id: 2,
      title: (
        <>
          Topic-wise & <span>Chapter-wise Practice</span>
        </>
      ),
      description:
        'Master every subject step-by-step with structured practice tests, real-time timer countdowns, and immediate solution reviews.',
      primaryBtnText: '📝 Start Practice Now',
      primaryBtnAction: () => openAuthModal('login'),
      secondaryBtnText: 'View Categories ➔',
      secondaryBtnLink: '#test-series',
    },
    {
      id: 3,
      title: (
        <>
          Empowering Aspirants for <span>Better Results</span>
        </>
      ),
      description:
        'Join thousands of dedicated learners building confidence through regular mock testing and smart accuracy tracking.',
      primaryBtnText: '🎯 Join ExamHunters Free',
      primaryBtnAction: () => openAuthModal('register'),
      secondaryBtnText: 'Career Guidance ➔',
      secondaryBtnLink: '#career',
    },
  ];

  // Auto-play interval for Slider
  useEffect(() => {
    autoPlayRef.current = nextSlide;
  });

  useEffect(() => {
    const play = () => {
      autoPlayRef.current();
    };
    const interval = setInterval(play, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

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
      setMessage({ type: '', text: '' });
    }
    setAuthModal(modalType);
  };

  // 🎯 Modal Close Handler
  const closeAuthModal = () => {
    setAuthModal(null);
    setMessage({ type: '', text: '' });
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

  // Fallback image handler in case primary link faces CORS/network issue
  const handleImageError = (e, backupSrc) => {
    e.target.onerror = null;
    e.target.src = backupSrc;
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

      {/* Hero Banner Slider Section */}
      <section className="hero-section">
        <button className="slider-arrow prev-arrow" onClick={prevSlide} aria-label="Previous Slide">
          &#10094;
        </button>
        
        <div className="hero-slider-wrapper">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`hero-content slide ${index === currentSlide ? 'active-slide' : ''}`}
            >
              <h1>{slide.title}</h1>
              <p>{slide.description}</p>
              <div className="hero-cta-group">
                <button className="btn-hero-primary" onClick={slide.primaryBtnAction}>
                  {slide.primaryBtnText}
                </button>
                <a href={slide.secondaryBtnLink} className="btn-hero-secondary">
                  {slide.secondaryBtnText}
                </a>
              </div>
            </div>
          ))}
        </div>

        <button className="slider-arrow next-arrow" onClick={nextSlide} aria-label="Next Slide">
          &#10095;
        </button>

        {/* Slider Dots Indicator */}
        <div className="slider-dots">
          {heroSlides.map((_, index) => (
            <span
              key={index}
              className={`dot ${index === currentSlide ? 'active-dot' : ''}`}
              onClick={() => setCurrentSlide(index)}
            ></span>
          ))}
        </div>
      </section>

      {/* FEATURED EXAM CATEGORIES SECTION */}
      <section id="test-series" className="section-padding">
        <h2 className="section-title">Available Exam Series</h2>
        <p className="sub-title-center" style={{ marginTop: '-20px', marginBottom: '30px' }}>
          Explore active test categories. Click to attempt practice tests for free.
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
                <p>Topic-wise Practice Papers, Chapter Mock Tests & Solution Keys</p>
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
            <h3>Topic & Chapter Tests</h3>
            <p>Target specific subjects and strengthen individual chapters easily.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⏱️</div>
            <h3>Real Exam Timer Engine</h3>
            <p>Simulate actual examination feel with question palette & countdown.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Instant Score & Analysis</h3>
            <p>Accuracy stats, correct vs wrong breakdown & detailed performance review.</p>
          </div>
        </div>
      </section>

      {/* ABOUT US SECTION - Indian Student Image */}
      <section id="about" className="section-padding">
        <div className="split-row">
          <div className="split-text-col">
            <span className="section-badge">100% Free Platform</span>
            <h2 className="section-title text-left">About ExamHunters</h2>
            <p className="description-text">
              <strong>ExamHunters</strong> is a completely <strong>free open digital learning platform</strong> designed to help aspirants practice and excel in competitive examinations without financial barriers.
            </p>
            <p className="description-text">
              We focus on building strong basics through <strong>Topic-wise Mock Tests, Chapter-wise Practice Sets, and Daily Question Drills</strong>. With real-time timer countdowns and detailed solution reviews, students can analyze their progress and achieve top results in every examination.
            </p>
            <div className="feature-pills">
              <span>✔ Completely Free Access</span>
              <span>✔ Topic-wise Practice Sets</span>
              <span>✔ Detailed Answer Reviews</span>
            </div>
          </div>
          <div className="split-img-col">
            <div className="img-frame">
              <img
                src="https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Indian Student Studying Online"
                className="split-img"
                onError={(e) =>
                  handleImageError(
                    e,
                    'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800'
                  )
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* OUR VISION SECTION - Indian Student / Group Image (Zig-Zag) */}
      <section id="vision" className="section-padding bg-alt">
        <div className="split-row reverse-row">
          <div className="split-img-col">
            <div className="img-frame">
              <img
                src="https://images.pexels.com/photos/5905709/pexels-photo-5905709.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Indian Student Exam Preparation"
                className="split-img"
                onError={(e) =>
                  handleImageError(
                    e,
                    'https://images.pexels.com/photos/159844/cellular-education-classroom-159844.jpeg?auto=compress&cs=tinysrgb&w=800'
                  )
                }
              />
            </div>
          </div>
          <div className="split-text-col">
            <span className="section-badge badge-purple">Our Mission & Goal</span>
            <h2 className="section-title text-left">Our Vision</h2>
            <p className="description-text">
              Our core vision is to make quality exam preparation <strong>accessible to every student across urban and rural areas</strong> alike.
            </p>
            <p className="description-text">
              We believe every dedicated aspirant deserves a fair chance to succeed. By providing structured chapter-level tests and smart accuracy analysis, we empower students to turn their hard work into outstanding performance.
            </p>
          </div>
        </div>
      </section>

      {/* MOTIVATIONAL CAREER GUIDANCE SECTION */}
      <section id="career" className="section-padding">
        <div className="career-header">
          <h2 className="section-title">Career & Success Guidance</h2>
          <p className="sub-title-center">
            "Your Dream Job is Not Far Away — Consistency & Right Practice is All You Need!"
          </p>
        </div>

        <div className="motivational-grid">
          <div className="motivation-card">
            <div className="m-icon">🎯</div>
            <h3>1. Practice Daily</h3>
            <p>
              Consistency beats genius. Solving topic-wise mock tests daily helps build memory retention and subject confidence.
            </p>
          </div>
          <div className="motivation-card">
            <div className="m-icon">⚡</div>
            <h3>2. Master Speed & Accuracy</h3>
            <p>
              Knowledge alone isn't enough; time management matters! Use our live countdown timer to train your mind for exam speed.
            </p>
          </div>
          <div className="motivation-card">
            <div className="m-icon">🏆</div>
            <h3>3. Learn From Mistakes</h3>
            <p>
              Analyze your wrong answers after every test. Turning weak topics into strengths is the secret recipe of top scorers.
            </p>
          </div>
        </div>

        <div className="career-cta-banner">
          <h3>Ready to Test Your Skill Level Today?</h3>
          <p>Join ExamHunters for Free and Start Your Preparation Right Now.</p>
          <button className="btn-hero-primary" onClick={() => openAuthModal('register')}>
            🚀 Start Free Practice Test
          </button>
        </div>
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
                <h3>Create Free Account</h3>
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