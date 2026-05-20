import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { FileText, Users, CheckCircle, TrendingUp, ActivitySquare } from 'lucide-react';
import { roleLabel } from '../../utils/roleLabel';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ tests: 0, users: 0, released: 0, submissions: 0 });
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [testsRes, usersRes] = await Promise.all([
        adminService.getAllTests(),
        adminService.getAllUsers(),
      ]);
      const testsData = testsRes.data.data || [];
      const usersData = usersRes.data.data || [];
      const submissionsResponses = await Promise.all(
        testsData.map((test) => adminService.getSubmissions(test.id))
      );
      const submissionsByTest = submissionsResponses.map((res) => res.data.data || []);
      const pendingSubmissions = testsData.reduce((sum, test, index) => {
        const eligibleUsers = usersData.filter(
          (user) => user.teamId === test.assignedTeamId && user.role === test.assignedRole
        ).length;
        const submittedCount = submissionsByTest[index]?.length || 0;
        return sum + Math.max(eligibleUsers - submittedCount, 0);
      }, 0);
      setTests(testsData.slice(0, 5));
      setStats({
        tests: testsData.length,
        users: usersData.length,
        released: testsData.filter((t) => t.resultsReleased).length,
        submissions: pendingSubmissions,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner className="min-h-[60vh]" size="lg" />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor assessments, users, and submissions</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-sm">
          <FileText className="w-8 h-8 mb-4 opacity-80" />
          <p className="text-sm opacity-90 mb-1">Total Assessments</p>
          <p className="text-3xl font-bold">{stats.tests}</p>
          <p className="text-xs opacity-75 mt-2">+3 this week</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-sm">
          <Users className="w-8 h-8 mb-4 opacity-80" />
          <p className="text-sm opacity-90 mb-1">Active Users</p>
          <p className="text-3xl font-bold">{stats.users}</p>
          <p className="text-xs opacity-75 mt-2">+12 this month</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-sm">
          <CheckCircle className="w-8 h-8 mb-4 opacity-80" />
          <p className="text-sm opacity-90 mb-1">Results Released</p>
          <p className="text-3xl font-bold">{stats.released}</p>
          <p className="text-xs opacity-75 mt-2">
            {stats.tests > 0 ? Math.round((stats.released / stats.tests) * 100) : 0}% completion
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-sm">
          <ActivitySquare className="w-8 h-8 mb-4 opacity-80" />
          <p className="text-sm opacity-90 mb-1">Pending Submissions</p>
          <p className="text-3xl font-bold">{stats.submissions}</p>
          <p className="text-xs opacity-75 mt-2">Awaiting review</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Assessments */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Assessments</h2>
            <a href="/admin/tests" className="text-sm text-blue-600 hover:underline font-medium">
              View All →
            </a>
          </div>

          <div className="space-y-3">
            {tests.map((test, idx) => (
              <div
                key={test.id}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{test.title}</h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                    <span className="px-2 py-0.5 bg-gray-100 rounded">
                      {roleLabel(test.assignedRole)}
                    </span>
                    <span>•</span>
                    <span>{test.assignedTeamName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={test.resultsReleased ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                    {test.resultsReleased ? '✓ Released' : '◐ Pending'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Activity Feed</h2>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="relative">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div className="absolute left-0.5 top-4 w-px h-12 bg-gray-200"></div>
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium text-gray-900">New test created</p>
                <p className="text-xs text-gray-600 mt-1">Python Assessment - Senior</p>
                <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="relative">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div className="absolute left-0.5 top-4 w-px h-12 bg-gray-200"></div>
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium text-gray-900">Results released</p>
                <p className="text-xs text-gray-600 mt-1">JavaScript Basics Assessment</p>
                <p className="text-xs text-gray-500 mt-1">5 hours ago</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="relative">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                <div className="absolute left-0.5 top-4 w-px h-12 bg-gray-200"></div>
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium text-gray-900">User registered</p>
                <p className="text-xs text-gray-600 mt-1">johndoe@company.com</p>
                <p className="text-xs text-gray-500 mt-1">1 day ago</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="relative">
                <div className="w-2 h-2 bg-amber-600 rounded-full mt-2"></div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Submissions pending</p>
                <p className="text-xs text-gray-600 mt-1">12 users completed assessment</p>
                <p className="text-xs text-gray-500 mt-1">2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
