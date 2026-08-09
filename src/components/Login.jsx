import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Form Validation
  const validate = () => {
    let tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const response = await API.post('/auth/login', formData);

    if (response.data.success) {
      const userData = response.data.data;

      // Token और User Data को LocalStorage में सेव करें
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData));

      // 🎯 Role के हिसाब से रीडायरेक्ट करें
      if (userData.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    }
  } catch (err) {
    setApiError(
      err.response?.data?.message || 'Unable to connect to server. Please try again.'
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-logo">🎯</div>
          <h2>ExamHunters</h2>
          <p>Login to access your dashboard</p>
        </div>

        {apiError && <div className="error-alert">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
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

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;