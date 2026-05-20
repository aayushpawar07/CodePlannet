import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { testService } from '../../services/testService';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { Clock, ChevronLeft, ChevronRight, AlertTriangle, Flag, CheckCircle2 } from 'lucide-react';

export default function TakeTestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fullscreenWarnings, setFullscreenWarnings] = useState(0);
  const startTimeRef = useRef(new Date().toISOString());
  const timerRef = useRef(null);
  const testContainerRef = useRef(null);

  // Enter fullscreen on test load
  useEffect(() => {
    if (test && !submitted) {
      enterFullscreen();
    }
  }, [test, submitted]);

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && test && !submitted) {
        setFullscreenWarnings((prev) => {
          const newCount = prev + 1;
          
          if (newCount >= 2) {
            toast.error('Test auto-submitted due to exiting fullscreen multiple times');
            handleSubmit();
          } else {
            toast.error(`Warning ${newCount}/2: Please stay in fullscreen mode. Test will be auto-submitted on next exit.`);
            enterFullscreen();
          }
          
          return newCount;
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [test, submitted]);

  // Prevent copy, cut, paste, and context menu
  useEffect(() => {
    const preventActions = (e) => {
      e.preventDefault();
      toast.error('This action is disabled during the test');
    };

    const preventKeyboardShortcuts = (e) => {
      // Prevent Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+A, Ctrl+P, F12, etc.
      if (
        (e.ctrlKey && ['c', 'x', 'v', 'a', 'p', 's', 'u'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        toast.error('This action is disabled during the test');
      }
    };

    if (test && !submitted) {
      document.addEventListener('copy', preventActions);
      document.addEventListener('cut', preventActions);
      document.addEventListener('paste', preventActions);
      document.addEventListener('contextmenu', preventActions);
      document.addEventListener('keydown', preventKeyboardShortcuts);
    }

    return () => {
      document.removeEventListener('copy', preventActions);
      document.removeEventListener('cut', preventActions);
      document.removeEventListener('paste', preventActions);
      document.removeEventListener('contextmenu', preventActions);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
    };
  }, [test, submitted]);

  const enterFullscreen = async () => {
    try {
      if (testContainerRef.current && !document.fullscreenElement) {
        await testContainerRef.current.requestFullscreen();
      }
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
      toast.error('Please allow fullscreen mode to take the test');
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Failed to exit fullscreen:', err);
    }
  };

  useEffect(() => {
    fetchTest();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      exitFullscreen();
    };
  }, [id]);

  const fetchTest = async () => {
    try {
      const res = await testService.getTestById(id);
      const testData = res.data.data;
      setTest(testData);
      setTimeLeft(testData.timeLimitMinutes * 60);
      startTimeRef.current = new Date().toISOString();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load test';
      toast.error(errorMsg);
      setTimeout(() => navigate('/dashboard/tests'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (submitted || submitting) return;
    setSubmitting(true);

    const answersPayload = test.questions.map((q) => {
      const answer = answers[q.id];
      const selectedOptionIds = Array.isArray(answer) ? answer : (answer ? [answer] : []);
      
      return {
        questionId: q.id,
        selectedOptionIds: selectedOptionIds,
      };
    });

    try {
      await testService.submitTest(id, {
        startTime: startTimeRef.current,
        answers: answersPayload,
      });
      setSubmitted(true);
      await exitFullscreen();
      toast.success('Test submitted successfully!');
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeout(() => navigate('/dashboard/tests'), 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to submit test';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }, [test, answers, id, submitted, submitting, navigate]);

  useEffect(() => {
    if (!test || submitted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [test, submitted, handleSubmit]);

  const selectOption = (questionId, optionId, isMultiCorrect) => {
    setAnswers((prev) => {
      const currentAnswer = prev[questionId];
      
      if (isMultiCorrect) {
        const currentArray = Array.isArray(currentAnswer) ? currentAnswer : (currentAnswer ? [currentAnswer] : []);
        const isSelected = currentArray.includes(optionId);
        
        if (isSelected) {
          return { ...prev, [questionId]: currentArray.filter(id => id !== optionId) };
        } else {
          return { ...prev, [questionId]: [...currentArray, optionId] };
        }
      } else {
        return { ...prev, [questionId]: optionId };
      }
    });
  };

  const toggleFlag = (questionId) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <Spinner className="min-h-[60vh]" size="lg" />;
  if (!test) return null;

  const question = test.questions[currentQ];
  const isLowTime = timeLeft < 60;
  const isMultiCorrect = question.multiCorrect || false;
  const answeredCount = Object.keys(answers).filter(qId => {
    const answer = answers[qId];
    return Array.isArray(answer) ? answer.length > 0 : answer != null;
  }).length;

  const getQuestionStatus = (q) => {
    const answer = answers[q.id];
    const isAnswered = Array.isArray(answer) ? answer.length > 0 : answer != null;
    const isFlagged = flaggedQuestions.has(q.id);
    
    if (isFlagged) return 'flagged';
    if (isAnswered) return 'answered';
    return 'unanswered';
  };

  return (
    <div ref={testContainerRef} className="h-screen flex flex-col bg-gray-50 select-none" style={{ userSelect: 'none' }}>
      {/* Top Header */}
      <div className={`sticky top-0 z-40 ${isLowTime ? 'bg-red-600' : 'bg-blue-600'} text-white p-4 shadow-md`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{test.title}</h1>
            <p className="text-blue-100 text-sm">
              Question {currentQ + 1} of {test.questions.length} • {answeredCount}/{test.questions.length} answered
            </p>
          </div>
          <div className={`flex items-center gap-3 px-4 py-2 rounded-lg ${isLowTime ? 'bg-red-500' : 'bg-blue-700'}`}>
            <Clock className="w-5 h-5" />
            <span className="text-2xl font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Question Navigator */}
        <div className="w-32 lg:w-40 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Questions</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {test.questions.map((q, i) => {
              const status = getQuestionStatus(q);
              
              let bgClass = 'bg-gray-100 text-gray-700 hover:bg-gray-200';
              if (status === 'answered') {
                bgClass = 'bg-green-100 text-green-700 border border-green-300';
              } else if (status === 'flagged') {
                bgClass = 'bg-amber-100 text-amber-700 border-2 border-amber-400';
              }
              if (i === currentQ) {
                bgClass = 'bg-blue-600 text-white border-2 border-blue-700';
              }
              
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQ(i)}
                  className={`w-full h-10 rounded-lg font-semibold text-sm transition-all ${bgClass}`}
                  title={`Question ${i + 1}${status === 'flagged' ? ' (Flagged)' : status === 'answered' ? ' (Answered)' : ''}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-200 space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-600"></div>
              <span className="text-gray-600">Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
              <span className="text-gray-600">Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-100 border border-amber-400"></div>
              <span className="text-gray-600">Flagged</span>
            </div>
          </div>
        </div>

        {/* Main Question Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-6 lg:p-8">
            {/* Question Card */}
            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-gray-200 mb-6">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex-1">{question.questionText}</h2>
                <button
                  onClick={() => toggleFlag(question.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    flaggedQuestions.has(question.id)
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Flag for review"
                >
                  <Flag className="w-5 h-5" />
                </button>
              </div>

              {isMultiCorrect && (
                <div className="mb-6 p-3 bg-blue-50 border-l-4 border-blue-600 rounded">
                  <p className="text-sm text-blue-900 font-medium">
                    💡 This question has multiple correct answers. Select all that apply.
                  </p>
                </div>
              )}

              {/* Options */}
              <div className="space-y-3">
                {question.options.map((option, idx) => {
                  const answer = answers[question.id];
                  const isSelected = isMultiCorrect
                    ? (Array.isArray(answer) && answer.includes(option.id))
                    : (answer === option.id);
                  
                  return (
                    <label
                      key={option.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type={isMultiCorrect ? 'checkbox' : 'radio'}
                        name={isMultiCorrect ? `question-${question.id}-${option.id}` : `question-${question.id}`}
                        checked={isSelected}
                        onChange={() => selectOption(question.id, option.id, isMultiCorrect)}
                        className="w-5 h-5 mt-0.5 cursor-pointer accent-blue-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-600">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          <span className="text-gray-900">{option.optionText}</span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="secondary"
                onClick={() => setCurrentQ((prev) => Math.max(0, prev - 1))}
                disabled={currentQ === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="text-sm text-gray-600 font-medium">
                {currentQ + 1} of {test.questions.length}
              </div>

              {currentQ < test.questions.length - 1 ? (
                <Button 
                  onClick={() => setCurrentQ((prev) => prev + 1)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  loading={submitting}
                  className={`${
                    answeredCount < test.questions.length
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {answeredCount < test.questions.length && (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Warning:
                    </>
                  )}
                  {answeredCount < test.questions.length ? ` ${test.questions.length - answeredCount} unanswered` : 'Submit Test'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
