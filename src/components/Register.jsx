import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false); // Success state
  const navigate = useNavigate();

  // Form Validation Handler
  const validate = () => {
    let tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) {
      tempErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 3) {
      tempErrors.name = 'Name must be at least 3 characters long';
    }

    if (!formData.email.trim()) {
      tempErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email)) {
      tempErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      tempErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      tempErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      const response = await API.post('/auth/register', payload);

      if (response.data.success) {
        // डायरेक्ट टोकन सेव करने के बजाय Success Card दिखाएं
        setIsRegistered(true);
      }
    } catch (err) {
      setApiError(
        err.response?.data?.message || 'Registration failed. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 1. Success Message View (रजिस्ट्रेशन सफल होने के बाद दिखेगा)
  if (isRegistered) {
    return (
      <div className="register-wrapper">
        <div className="register-card success-card">
          <div className="register-header">
            <div className="brand-logo">🎉</div>
            <h2>Registration Successful!</h2>
            <p>Your account has been created successfully.</p>
          </div>

          <div className="success-body">
            <p className="success-msg">
              Welcome to <strong>ExamHunters</strong>! Please proceed to login with your credentials.
            </p>
            <button 
              className="register-btn" 
              onClick={() => navigate('/login')}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Normal Registration Form View
  return (
    <div className="register-wrapper">
      <div className="register-card">
        <div className="register-header">
          <div className="brand-logo">🎯</div>
          <h2>ExamHunters</h2>
          <p>Create an account to get started</p>
        </div>

        {apiError && <div className="error-alert">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'input-error' : ''}
            />
            {errors.name && <span className="field-error-msg">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="field-error-msg">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <span className="field-error-msg">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'input-error' : ''}
            />
            {errors.confirmPassword && (
              <span className="field-error-msg">{errors.confirmPassword}</span>
            )}
          </div>

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Create Account'}
          </button>
        </form>

        <div className="register-footer">
          <p>
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;