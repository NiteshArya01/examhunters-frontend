import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import './ExamWindow.css';

const ExamWindow = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [testData, setTestData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scoreResult, setScoreResult] = useState(null);

  useEffect(() => {
    fetchTestDetails();
  }, [testId]);

  const fetchTestDetails = async () => {
    try {
      const res = await API.get(`/tests/${testId}`);
      if (res.data.success) {
        const test = res.data.data;
        setTestData(test);
        setQuestions(test.questions || []);
        setTimeLeft((test.durationMinutes || 60) * 60);
      }
    } catch (err) {
      setError('Failed to load exam paper. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading || isSubmitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, isSubmitted, timeLeft]);

  const handleOptionSelect = (optionKey) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: optionKey,
    });
  };

  const handleSubmitExam = () => {
    let attempted = 0;
    let correctCount = 0;
    let wrongCount = 0;

    const totalQuestions = questions.length;
    const marksPerQuestion = testData.totalMarks / (totalQuestions || 1);

    questions.forEach((q, index) => {
      const userAns = selectedAnswers[index];
      if (userAns) {
        attempted++;
        if (userAns.toUpperCase() === q.correctOption.toUpperCase()) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }
    });

    const obtainedMarks = (correctCount * marksPerQuestion).toFixed(2);
    const skipped = totalQuestions - attempted;
    const percentage = ((obtainedMarks / testData.totalMarks) * 100).toFixed(1);
    const accuracy = attempted > 0 ? ((correctCount / attempted) * 100).toFixed(1) : 0;

    setScoreResult({
      totalQuestions,
      attempted,
      skipped,
      correctCount,
      wrongCount,
      totalMarks: testData.totalMarks,
      obtainedMarks,
      percentage,
      accuracy,
    });

    setIsSubmitted(true);
  };

  // Re-Test Function
  const handleReTest = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setTimeLeft((testData?.durationMinutes || 60) * 60);
    setIsSubmitted(false);
    setScoreResult(null);
  };

  // PDF Download Function (Clean Print View)
  const handleDownloadPDF = () => {
    window.print();
  };

  const formatTimer = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // MATCHED LOADING UI WITH CATEGORY TESTS DESIGN
  if (loading) {
    return (
      <div className="exam-container flex-center">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading Question Paper...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exam-container flex-center">
        <div className="error-state">{error}</div>
      </div>
    );
  }

  // 1. RESULT & ANSWER KEY REVIEW SCREEN
  if (isSubmitted && scoreResult) {
    return (
      <div className="summary-wrapper">
        <div className="summary-card printable-area">
          <div className="summary-header">
            <div className="trophy-icon">🏆</div>
            <h2>{testData.topicTitle}</h2>
            <p>Performance Summary & Review</p>
          </div>

          <div className="score-badge">
            <span>Score</span>
            <h1>{scoreResult.correctCount} / {scoreResult.totalQuestions}</h1>
            <p>{scoreResult.accuracy}% Accuracy ({scoreResult.obtainedMarks} Marks Scored)</p>
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-label">Total Questions</span>
              <span className="stat-value">{scoreResult.totalQuestions}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Attempted</span>
              <span className="stat-value text-blue">{scoreResult.attempted}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Skipped</span>
              <span className="stat-value text-yellow">{scoreResult.skipped}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Correct</span>
              <span className="stat-value text-green">{scoreResult.correctCount}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Wrong</span>
              <span className="stat-value text-red">{scoreResult.wrongCount}</span>
            </div>
          </div>

          {/* Action Buttons (Re-Test & Download PDF) */}
          <div className="review-action-btns no-print">
            <button className="retest-btn" onClick={handleReTest}>
              🔄 Re-Test (पुनः प्रयास)
            </button>
            <button className="download-pdf-btn" onClick={handleDownloadPDF}>
              📄 Download PDF
            </button>
          </div>

          {/* Answer Key & Review Section */}
          <div className="answer-key-section">
            <h3 className="review-title">उत्तर कुंजी एवं समीक्षा (Answer Key & Review):</h3>

            <div className="review-list">
              {questions.map((q, idx) => {
                const userAns = selectedAnswers[idx];
                const correctAns = q.correctOption.toUpperCase();

                let statusBadge = '';
                let statusClass = '';

                if (!userAns) {
                  statusBadge = '⚪ छोड़ा गया (Skipped)';
                  statusClass = 'status-skipped';
                } else if (userAns.toUpperCase() === correctAns) {
                  statusBadge = '✅ सही (Correct)';
                  statusClass = 'status-correct';
                } else {
                  statusBadge = '❌ गलत (Wrong)';
                  statusClass = 'status-wrong';
                }

                return (
                  <div key={idx} className={`review-card ${statusClass}`}>
                    <div className="review-q-header">
                      <strong>प्रश्न {idx + 1}: {q.questionText}</strong>
                      <span className="review-badge">{statusBadge}</span>
                    </div>

                    <div className="review-details">
                      <p>
                        आपका उत्तर:{' '}
                        <strong>
                          {userAns
                            ? `(${userAns}) ${q.options?.[userAns.toLowerCase()] || ''}`
                            : 'कोई उत्तर नहीं चुना (Skipped)'}
                        </strong>
                      </p>
                      <p className="correct-ans-text">
                        सही उत्तर: <strong>({correctAns}) {q.options?.[correctAns.toLowerCase()]}</strong>
                      </p>
                      {q.explanation && (
                        <p className="explanation-text">
                          💡 <strong>Explanation:</strong> {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="summary-actions no-print" style={{ marginTop: '30px' }}>
            <button className="dashboard-btn" onClick={() => navigate('/student/dashboard')}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. LIVE EXAM INTERFACE SCREEN
  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="exam-container">
      <div className="exam-header">
        <div className="exam-title-group">
          <h2>{testData.topicTitle}</h2>
          <span className="q-count-badge">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>

        <div className="exam-timer-box">
          ⏱️ Time Remaining: <strong>{formatTimer(timeLeft)}</strong>
        </div>
      </div>

      <div className="exam-body">
        <div className="question-panel">
          <div className="question-box">
            <h3>Q{currentQuestionIndex + 1}. {currentQ?.questionText}</h3>

            <div className="options-list">
              {['A', 'B', 'C', 'D'].map((optKey) => {
                const optText = currentQ?.options?.[optKey.toLowerCase()];
                if (!optText) return null;

                const isSelected = selectedAnswers[currentQuestionIndex] === optKey;

                return (
                  <label
                    key={optKey}
                    className={`option-card ${isSelected ? 'option-selected' : ''}`}
                    onClick={() => handleOptionSelect(optKey)}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestionIndex}`}
                      checked={isSelected}
                      onChange={() => {}}
                    />
                    <span className="option-prefix">{optKey}.</span>
                    <span className="option-text">{optText}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="exam-nav-bar">
            <button
              className="nav-btn"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
            >
              ⬅️ Previous
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                className="nav-btn primary-btn"
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              >
                Next ➡️
              </button>
            ) : (
              <button className="submit-exam-btn" onClick={handleSubmitExam}>
                🚀 Submit Test
              </button>
            )}
          </div>
        </div>

        <div className="palette-panel">
          <h4>Question Palette</h4>
          <div className="palette-grid">
            {questions.map((_, idx) => {
              const isAns = selectedAnswers[idx] !== undefined;
              const isCurrent = idx === currentQuestionIndex;

              return (
                <button
                  key={idx}
                  className={`palette-btn ${isAns ? 'btn-answered' : ''} ${
                    isCurrent ? 'btn-current' : ''
                  }`}
                  onClick={() => setCurrentQuestionIndex(idx)}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="palette-legend">
            <div><span className="dot dot-current"></span> Current</div>
            <div><span className="dot dot-answered"></span> Answered</div>
            <div><span className="dot dot-unanswered"></span> Unanswered</div>
          </div>

          <button className="sidebar-submit-btn" onClick={handleSubmitExam}>
            Submit Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamWindow;