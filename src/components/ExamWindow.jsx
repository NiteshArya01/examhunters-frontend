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

  // 🌐 Frontend Translation States
  const [currentLang, setCurrentLang] = useState('orig'); // 'orig' | 'trans'
  const [translations, setTranslations] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);

  // 📡 Network Offline / Online State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkAlert, setNetworkAlert] = useState(false);

  // Monitor Network Status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkAlert(true);
      setTimeout(() => setNetworkAlert(false), 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNetworkAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    fetchTestDetails();
  }, [testId]);

  const fetchTestDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get(`/tests/${testId}`);
      if (res.data.success) {
        const test = res.data.data;
        setTestData(test);
        setQuestions(test.questions || []);
        setTimeLeft((test.durationMinutes || 60) * 60);
      } else {
        setError(res.data.message || 'Failed to load exam paper.');
      }
    } catch (err) {
      if (!navigator.onLine) {
        setError('No internet connection. Please connect to the internet and retry.');
      } else {
        setError(err.response?.data?.message || 'Failed to load exam paper. Please try again.');
      }
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

  // Client-Side Translation Helper
  const translateText = async (text, targetLang) => {
    if (!text || text.trim() === '') return text;
    try {
      const langPair = targetLang === 'hi' ? 'en|hi' : 'hi|en';
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`
      );
      const data = await response.json();
      if (data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText;
      }
      return text;
    } catch (e) {
      console.error('Translation error:', e);
      return text;
    }
  };

  // Toggle & Translate Question
  const handleToggleLanguage = async () => {
    if (!navigator.onLine) {
      alert('⚠️ Internet connection is required to translate questions.');
      return;
    }

    if (currentLang === 'trans') {
      setCurrentLang('orig');
      return;
    }

    if (translations[currentQuestionIndex]) {
      setCurrentLang('trans');
      return;
    }

    const q = questions[currentQuestionIndex];
    if (!q) return;

    setIsTranslating(true);

    const hasHindiChars = /[\u0900-\u097F]/.test(q.questionText);
    const targetLang = hasHindiChars ? 'en' : 'hi';

    try {
      const [transQText, transOptA, transOptB, transOptC, transOptD, transExpl] = await Promise.all([
        translateText(q.questionText, targetLang),
        translateText(q.options?.a, targetLang),
        translateText(q.options?.b, targetLang),
        translateText(q.options?.c, targetLang),
        translateText(q.options?.d, targetLang),
        translateText(q.explanation || '', targetLang),
      ]);

      setTranslations((prev) => ({
        ...prev,
        [currentQuestionIndex]: {
          questionText: transQText,
          options: {
            a: transOptA,
            b: transOptB,
            c: transOptC,
            d: transOptD,
          },
          explanation: transExpl,
        },
      }));

      setCurrentLang('trans');
    } catch (err) {
      console.error(err);
    } finally {
      setIsTranslating(false);
    }
  };

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
    const marksPerQuestion = testData?.totalMarks / (totalQuestions || 1);

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
    const percentage = ((obtainedMarks / (testData?.totalMarks || 100)) * 100).toFixed(1);
    const accuracy = attempted > 0 ? ((correctCount / attempted) * 100).toFixed(1) : 0;

    setScoreResult({
      totalQuestions,
      attempted,
      skipped,
      correctCount,
      wrongCount,
      totalMarks: testData?.totalMarks || 100,
      obtainedMarks,
      percentage,
      accuracy,
    });

    setIsSubmitted(true);
  };

  const handleReTest = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setCurrentLang('orig');
    setTimeLeft((testData?.durationMinutes || 60) * 60);
    setIsSubmitted(false);
    setScoreResult(null);
  };

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

  // 🌀 1. ATTRACTIVE EXAM-THEMED LOADER SCREEN
  if (loading) {
    return (
      <div className="exam-container flex-center">
        <div className="exam-loader-card">
          <div className="loader-animated-icon">
            <span className="exam-doc-icon">📝</span>
            <div className="scan-line"></div>
          </div>
          <h3 className="loader-title">Setting Up Your Exam Paper...</h3>
          <p className="loader-desc">
            Please wait while we initialize your questions and security environment.
          </p>
          <div className="loader-progress-bar">
            <div className="loader-progress-inner"></div>
          </div>
          <div className="loader-warning">
            ⚠️ <strong>Please do not refresh or close this window.</strong>
          </div>
        </div>
      </div>
    );
  }

  // ⚠️ 2. ERROR & NO INTERNET INITIAL SCREEN
  if (error) {
    return (
      <div className="exam-container flex-center">
        <div className="exam-error-card">
          <div className="error-icon">📡</div>
          <h2>Unable to Load Exam</h2>
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchTestDetails}>
            🔄 Retry Connecting
          </button>
        </div>
      </div>
    );
  }

  // 🏆 3. RESULT & SCORECARD SCREEN
  if (isSubmitted && scoreResult) {
    return (
      <div className="summary-wrapper">
        <div className="summary-card printable-area">
          <div className="summary-header">
            <div className="trophy-icon">🏆</div>
            <h2>{testData?.topicTitle}</h2>
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

          <div className="review-action-btns no-print">
            <button className="retest-btn" onClick={handleReTest}>
              🔄 Re-Test (पुनः प्रयास)
            </button>
            <button className="download-pdf-btn" onClick={handleDownloadPDF}>
              📄 Download PDF
            </button>
          </div>

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

  // 📝 4. LIVE EXAM INTERFACE SCREEN
  const originalQ = questions[currentQuestionIndex];
  const translatedQ = translations[currentQuestionIndex];
  const displayQ = currentLang === 'trans' && translatedQ ? translatedQ : originalQ;
  const isOriginalHindi = /[\u0900-\u097F]/.test(originalQ?.questionText || '');

  return (
    <div className="exam-container">
      {/* 📡 Network Dropdown / Flash Alert Bar */}
      {!isOnline && (
        <div className="network-alert-bar offline-alert">
          <span>⚠️ <strong>No Internet Connection!</strong> Please reconnect your network. Exam timer is running safely.</span>
        </div>
      )}
      {isOnline && networkAlert && (
        <div className="network-alert-bar online-alert">
          <span>✅ <strong>Internet Connected!</strong> You are back online.</span>
        </div>
      )}

      {/* Exam Header */}
      <div className="exam-header">
        <div className="exam-title-group">
          <h2>{testData?.topicTitle}</h2>
          <span className="q-count-badge">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>

        <div className="exam-header-right">
          <div className="exam-timer-box">
            ⏱️ Time Left: <strong>{formatTimer(timeLeft)}</strong>
          </div>
        </div>
      </div>

      <div className="exam-body">
        <div className="question-panel">
          <div className="question-box">
            {/* Question Header Row: Title & Responsive Translation Button */}
            <div className="question-box-header">
              <span className="question-num-tag">Q{currentQuestionIndex + 1}</span>
              
              <button
                type="button"
                className={`lang-toggle-btn ${isTranslating ? 'translating' : ''}`}
                onClick={handleToggleLanguage}
                disabled={isTranslating}
                title="Switch Language"
              >
                {isTranslating ? (
                  '⏳ Translating...'
                ) : currentLang === 'orig' ? (
                  `🌐 ${isOriginalHindi ? 'Translate to English' : 'हिंदी में अनुवाद करें'}`
                ) : (
                  '🌐 View Original Language'
                )}
              </button>
            </div>

            <h3 className="question-text-title">{displayQ?.questionText}</h3>

            <div className="options-list">
              {['A', 'B', 'C', 'D'].map((optKey) => {
                const optText = displayQ?.options?.[optKey.toLowerCase()];
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
              onClick={() => {
                setCurrentQuestionIndex(currentQuestionIndex - 1);
                setCurrentLang('orig');
              }}
            >
              ⬅️ Previous
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                className="nav-btn primary-btn"
                onClick={() => {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                  setCurrentLang('orig');
                }}
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
                  onClick={() => {
                    setCurrentQuestionIndex(idx);
                    setCurrentLang('orig');
                  }}
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