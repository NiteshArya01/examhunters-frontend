import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios';
import './StudentDashboard.css';

// Helper function to convert DB UTC string to exact Local Client Time
const getParsedDate = (dateStr) => {
  if (!dateStr) return new Date();
  
  // Agar ISO string bina Timezone offset 'Z' ke aayi hai (e.g. "2026-08-11T18:30")
  if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
    return new Date(dateStr); 
  }
  return new Date(dateStr);
};

// Live Countdown Timer
const CountdownTimer = ({ targetDate, onFinish }) => {
  const calculateTimeLeft = () => {
    if (!targetDate) return null;
    
    // Convert target date safely
    const target = new Date(targetDate).getTime();
    const now = new Date().getTime();
    
    const difference = target - now;
    if (difference <= 0) return null;

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (!remaining) {
        clearInterval(timer);
        if (onFinish) onFinish();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="countdown-box">
      <span className="timer-icon">⏳</span>
      <span className="timer-text">
        Starts in:{' '}
        <strong>
          {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
          {String(timeLeft.hours).padStart(2, '0')}h:
          {String(timeLeft.minutes).padStart(2, '0')}m:
          {String(timeLeft.seconds).padStart(2, '0')}s
        </strong>
      </span>
    </div>
  );
};

const CategoryTests = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const categoryTitle = location.state?.categoryTitle || 'Exam Series Tests';

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selected Test for Modal Instructions
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    fetchTests();
  }, [categoryId]);

  const fetchTests = async () => {
    try {
      const res = await API.get(`/tests/category/${categoryId}`);
      if (res.data.success) {
        setTests(res.data.data);
      }
    } catch (err) {
      setError('Failed to load tests for this category.');
    } finally {
      setLoading(false);
    }
  };

  // Availability Check with UTC Offset Fix
  const isTestAvailable = (startDateStr) => {
    if (!startDateStr) return true;

    const now = new Date();
    const testDate = new Date(startDateStr);

    // Test tabhi unlock hoga jab current time test start date/time ke barabar ya piche ho
    // UTC shift compensation
    const utcDiffMinutes = now.getTimezoneOffset(); 
    const adjustedTestTime = testDate.getTime() + (utcDiffMinutes * 60 * 1000);

    return now.getTime() >= adjustedTestTime || now.getTime() >= testDate.getTime();
  };

  // Indian Date Format Fix
  const formatDateOnly = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Start Test Window Handler
  const handleProceedToExam = () => {
    if (selectedTest) {
      navigate(`/student/exam/${selectedTest._id}`, {
        state: { testData: selectedTest, categoryTitle }
      });
    }
  };

  return (
    <div className="student-container">
      <div className="student-nav">
        <button className="back-btn" onClick={() => navigate('/student/dashboard')}>
          ⬅ Back to Categories
        </button>
        <div className="brand-title">🎯 ExamHunters</div>
      </div>

      <div className="student-content">
        <h2>{categoryTitle}</h2>
        <p className="sub-heading">Date-wise Practice Mock Tests</p>

        {loading ? (
          <div className="loading-state">Loading Tests...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : tests.length === 0 ? (
          <div className="empty-state">No tests uploaded for this category yet.</div>
        ) : (
          <div className="test-list">
            {tests.map((test) => {
              const available = isTestAvailable(test.startDate);

              return (
                <div key={test._id} className="test-card">
                  <div className="test-info">
                    <h3>{test.topicTitle}</h3>
                    <div className="test-meta">
                      <span>⏱ {test.durationMinutes} Mins</span>
                      <span>💯 {test.totalMarks} Marks</span>
                      <span>❓ {test.totalQuestions} Questions</span>
                      <span>📅 Date: {formatDateOnly(test.startDate)}</span>
                    </div>
                  </div>

                  <div className="test-action-group">
                    {!available && (
                      <CountdownTimer
                        targetDate={test.startDate}
                        onFinish={() => fetchTests()}
                      />
                    )}

                    <button
                      className={`start-test-btn ${!available ? 'disabled-btn' : ''}`}
                      disabled={!available}
                      onClick={() => available && setSelectedTest(test)}
                    >
                      {available ? 'Start Test' : 'Locked 🔒'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 📜 INSTRUCTIONS MODAL POPUP */}
      {selectedTest && (
        <div className="modal-overlay">
          <div className="instructions-card">
            <div className="modal-header">
              <h2>{categoryTitle} - {selectedTest.topicTitle}</h2>
              <p className="credit-text">Designed & Developed by ExamHunters Team</p>
            </div>

            <div className="instructions-box">
              <h3>परीक्षण के निर्देश (Instructions):</h3>
              <ul>
                <li>
                  इस अभ्यास सेट में कुल <strong>{selectedTest.totalQuestions} बहुविकल्पीय प्रश्न (MCQ)</strong> हैं।
                </li>
                <li>
                  परीक्षण की कुल समय सीमा <strong>{selectedTest.durationMinutes} मिनट</strong> है।
                </li>
                <li>
                  <strong>'Confirm & Start Test'</strong> बटन दबाते ही समय शुरू हो जाएगा।
                </li>
                <li>
                  समय समाप्त होने पर आपका टेस्ट स्वतः सबमिट हो जाएगा।
                </li>
                <li>
                  सबमिट करने के बाद आप स्कोर कार्ड और विस्तृत उत्तर देख सकते हैं।
                </li>
              </ul>
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setSelectedTest(null)}
              >
                Cancel
              </button>
              <button 
                className="confirm-start-btn" 
                onClick={handleProceedToExam}
              >
                Confirm & Start Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryTests;