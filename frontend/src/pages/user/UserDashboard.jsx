import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { testService } from '../../services/testService';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { BookOpen, Trophy, TrendingUp, CheckCircle2, Clock, Zap } from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [testsRes, resultsRes] = await Promise.all([
        testService.getAssignedTests(),
        testService.getResults(),
      ]);
      setTests(testsRes.data.data || []);
      setResults(resultsRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner className="min-h-[60vh]" size="lg" />;

  const available = tests.filter((t) => !t.alreadySubmitted && !t.resultsReleased);
  const completed = tests.filter((t) => t.alreadySubmitted);

  const scorePercents = results
    .map((r) => (r.totalMarks ? Math.round((r.score / r.totalMarks) * 100) : 0))
    .filter((s) => Number.isFinite(s));
  const avgScore = scorePercents.length > 0
    ? Math.round(scorePercents.reduce((sum, s) => sum + s, 0) / scorePercents.length)
    : 0;

  const normalizedDates = results
    .map((r) => r.endTime || r.startTime)
    .filter(Boolean)
    .map((dt) => {
      const date = new Date(dt);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    })
    .sort((a, b) => b - a);

  let currentStreak = 0;
  if (normalizedDates.length > 0) {
    currentStreak = 1;
    for (let i = 1; i < normalizedDates.length; i += 1) {
      const diffDays = Math.round((normalizedDates[i - 1] - normalizedDates[i]) / 86400000);
      if (diffDays === 1) {
        currentStreak += 1;
      } else if (diffDays > 1) {
        break;
      }
    }
  }

  const scoreTrendData = results
    .filter((r) => r.endTime || r.startTime)
    .sort((a, b) => new Date(a.endTime || a.startTime) - new Date(b.endTime || b.startTime))
    .slice(-7)
    .map((r, i) => ({
      label: new Date(r.endTime || r.startTime).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      score: r.totalMarks ? Math.round((r.score / r.totalMarks) * 100) : 0,
      index: i + 1,
    }));

  const passThreshold = 60;
  const successRate = scorePercents.length > 0
    ? Math.round((scorePercents.filter((s) => s >= passThreshold).length / scorePercents.length) * 100)
    : 0;

  const totalMinutes = results
    .filter((r) => r.startTime && r.endTime)
    .reduce((sum, r) => {
      const minutes = (new Date(r.endTime) - new Date(r.startTime)) / 60000;
      return sum + (Number.isFinite(minutes) ? Math.max(minutes, 0) : 0);
    }, 0);

  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const bestScore = scorePercents.length > 0 ? Math.max(...scorePercents) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600 mt-2 text-lg">Here's your assessment progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Available Tests</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{available.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Completed</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{completed.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Avg Score</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{avgScore}%</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <Trophy className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Current Streak</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{currentStreak} days</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Score Trends & Latest Assessments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Score Trend</h3>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>

          {scoreTrendData.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-end gap-2 h-40">
                {scoreTrendData.map((data) => {
                  const maxScore = Math.max(...scoreTrendData.map((d) => d.score));
                  const height = maxScore > 0 ? (data.score / maxScore) * 100 : 0;
                  return (
                    <div key={data.index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                        style={{ height: `${height}%` }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-2">{data.label}</span>
                      <span className="text-xs font-semibold text-gray-700">{data.score}%</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-gray-600">Based on your latest completed assessments</p>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No score trend yet. Complete a test to see your progress.</div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-700">Total Attempts</span>
              <span className="font-bold text-blue-600">{results.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-700">Success Rate</span>
              <span className="font-bold text-green-600">{successRate}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm text-gray-700">Time Spent</span>
              <span className="font-bold text-purple-600">{formatDuration(totalMinutes)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
              <span className="text-sm text-gray-700">Best Score</span>
              <span className="font-bold text-amber-600">{bestScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Assessments */}
      {available.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Available Assessments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {available.map((test) => {
              const isClosed = test.resultsReleased && !test.alreadySubmitted;
              
              return (
                <div
                  key={test.id}
                  className={`group p-4 border rounded-lg hover:shadow-md hover:border-blue-200 transition-all duration-200 ${
                    isClosed ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className={`font-semibold ${isClosed ? 'text-gray-500' : 'text-gray-900'} group-hover:text-blue-600 transition-colors`}>
                      {test.title}
                    </h3>
                    <div className="flex gap-2">
                      <Badge className="bg-blue-100 text-blue-700">
                        {test.timeLimitMinutes} min
                      </Badge>
                      {isClosed && (
                        <Badge className="bg-red-100 text-red-700">Closed</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{test.description}</p>
                  {isClosed ? (
                    <div className="text-xs text-gray-500">
                      ⏸️ Results released - Test closed for new attempts
                    </div>
                  ) : (
                    <Link to={`/dashboard/tests/${test.id}/take`} className="inline-flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                      Take Assessment →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Results</h2>
          <div className="space-y-3">
            {results.slice(0, 5).map((result, idx) => (
              <Link
                key={idx}
                to={`/dashboard/results/${result.id}`}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {result.score}%
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{result.testTitle}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(result.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronRight(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );
}
