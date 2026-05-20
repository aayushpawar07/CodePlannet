import { useState, useEffect } from 'react';
import { testService } from '../../services/testService';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { Trophy, CheckCircle2, XCircle, ChevronDown, ChevronUp, Award, TrendingUp, Clock } from 'lucide-react';

export default function ResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);
  const [expandedAnswers, setExpandedAnswers] = useState(new Set());

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await testService.getResults();
      const data = res.data.data || [];
      setResults(data);
      if (data.length > 0) {
        setSelectedResult(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAnswerExpanded = (answerId) => {
    const newSet = new Set(expandedAnswers);
    if (newSet.has(answerId)) {
      newSet.delete(answerId);
    } else {
      newSet.add(answerId);
    }
    setExpandedAnswers(newSet);
  };

  if (loading) return <Spinner className="min-h-[60vh]" size="lg" />;

  if (results.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Trophy className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Results Yet</h2>
        <p className="text-gray-600">Results will appear here after you submit assessments and admin releases them.</p>
      </div>
    );
  }

  const result = selectedResult;
  const percentage = result ? Math.round((result.score / result.totalMarks) * 100) : 0;
  const status = percentage >= 70 ? 'pass' : percentage >= 40 ? 'partial' : 'fail';
  
  const statusConfig = {
    pass: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: 'text-green-600', label: 'Excellent' },
    partial: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: 'text-amber-600', label: 'Good' },
    fail: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600', label: 'Needs Improvement' },
  };

  const config = statusConfig[status];
  const hasAnswerReview = (result?.answers?.length || 0) > 0;
  const correctAnswers = hasAnswerReview ? result.answers.filter(a => a.isCorrect).length : 0;
  const totalQuestions = hasAnswerReview ? result.answers.length : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Assessment Results</h1>
        <p className="text-gray-600 mt-2">Review your performance and answer explanations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Score Display */}
        <div className="lg:col-span-2">
          {result && (
            <div className={`rounded-2xl p-8 shadow-sm border-2 ${config.bg} ${config.border}`}>
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="text-gray-600 font-medium mb-2">Test Assessment</p>
                  <h2 className="text-3xl font-bold text-gray-900">{result.testTitle}</h2>
                </div>
                <div className={`p-3 rounded-lg ${config.bg}`}>
                  <Trophy className={`w-8 h-8 ${config.icon}`} />
                </div>
              </div>

              {/* Large Score Gauge */}
              <div className="flex items-center justify-center mb-8">
                <div className="relative w-40 h-40">
                  {/* Outer circle */}
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle cx="50" cy="50" r="45" fill="white" stroke="#e5e7eb" strokeWidth="2" />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke={status === 'pass' ? '#16a34a' : status === 'partial' ? '#d97706' : '#dc2626'}
                      strokeWidth="3"
                      strokeDasharray={`${(percentage / 100) * Math.PI * 2 * 45} ${Math.PI * 2 * 45}`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      opacity="0.8"
                    />
                  </svg>

                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-4xl font-bold text-gray-900">{percentage}</div>
                    <div className="text-sm text-gray-600">%</div>
                  </div>
                </div>
              </div>

              {/* Score Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-gray-600 font-medium">Score</span>
                  <span className="text-xl font-bold text-gray-900">{result.score}/{result.totalMarks}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-gray-600 font-medium">Status</span>
                  <Badge className={`${config.bg} ${config.text}`}>{config.label}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-gray-600 font-medium">Accuracy</span>
                  <span className="text-xl font-bold text-gray-900">
                    {hasAnswerReview ? `${correctAnswers}/${totalQuestions}` : '--'}
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg text-center border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Submitted</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {result.endTime ? new Date(result.endTime).toLocaleDateString() : '-'}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg text-center border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Time Taken</p>
                  <p className="text-sm font-semibold text-gray-900">--:--</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Sidebar */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 h-fit">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Results</h3>
          <div className="space-y-2">
            {results.map((res) => {
              const pct = Math.round((res.score / res.totalMarks) * 100);
              const isSelected = selectedResult?.id === res.id;
              
              return (
                <button
                  key={res.id}
                  onClick={() => {
                    setSelectedResult(res);
                    setExpandedAnswers(new Set());
                  }}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-200'
                  }`}
                >
                  <p className="font-medium text-gray-900 text-sm truncate">{res.testTitle}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-lg font-bold ${pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {pct}%
                    </span>
                    <span className="text-xs text-gray-500">{res.score}/{res.totalMarks}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Answer Review */}
      {hasAnswerReview ? (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Answer Review</h3>

          <div className="space-y-3">
            {result.answers.map((answer, i) => {
              const isCorrect = answer.isCorrect;
              const isExpanded = expandedAnswers.has(i);

              return (
                <div
                  key={i}
                  className={`rounded-lg border-2 overflow-hidden transition-all ${
                    isCorrect
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <button
                    onClick={() => toggleAnswerExpanded(i)}
                    className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                        {isCorrect ? (
                          <CheckCircle2 className={`w-5 h-5 text-green-600`} />
                        ) : (
                          <XCircle className={`w-5 h-5 text-red-600`} />
                        )}
                      </div>
                      <div className="text-left flex-1">
                        <h4 className={`font-semibold text-sm ${isCorrect ? 'text-green-900' : 'text-red-900'}`}>
                          Question {i + 1}
                        </h4>
                        <p className={`text-sm mt-1 line-clamp-1 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                          {answer.questionText}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className={`px-4 pb-4 pt-2 border-t-2 ${isCorrect ? 'border-green-200' : 'border-red-200'}`}>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Your Answer</p>
                          <div className={`p-3 rounded-lg ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                            <p className={`text-sm font-medium ${isCorrect ? 'text-green-900' : 'text-red-900'}`}>
                              {answer.selectedOptionTexts?.length > 0
                                ? answer.selectedOptionTexts.join('\n')
                                : answer.selectedOptionText || 'Not answered'}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Correct Answer</p>
                          <div className="p-3 rounded-lg bg-green-100">
                            <p className="text-sm font-medium text-green-900">
                              {answer.correctOptionTexts?.length > 0
                                ? answer.correctOptionTexts.join('\n')
                                : answer.correctOptionText || 'No correct answer set'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Answer Review</h3>
          <p className="text-sm text-gray-600">
            Answer review is not available after results are released to keep storage minimal.
          </p>
        </div>
      )}
    </div>
  );
}
