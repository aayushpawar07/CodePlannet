import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import Card, { CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Select from '../../components/ui/Select';
import toast from 'react-hot-toast';
import { ClipboardList, Send, Download } from 'lucide-react';
import { roleLabel } from '../../utils/roleLabel';

export default function SubmissionsPage() {
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [downloadingCSV, setDownloadingCSV] = useState(false);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await adminService.getAllTests();
      setTests(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (testId) => {
    setLoadingSubs(true);
    try {
      const res = await adminService.getSubmissions(testId);
      setSubmissions(res.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch submissions');
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleTestChange = (e) => {
    const id = e.target.value;
    setSelectedTestId(id);
    if (id) fetchSubmissions(id);
    else setSubmissions([]);
  };

  const handleRelease = async () => {
    if (!selectedTestId) return;
    setReleasing(true);
    try {
      await adminService.releaseResults(selectedTestId);
      toast.success('Results released and emails sent!');
      fetchTests();
      fetchSubmissions(selectedTestId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to release results');
    } finally {
      setReleasing(false);
    }
  };

  const handleDownloadCSV = async () => {
    if (!selectedTestId) return;
    setDownloadingCSV(true);
    try {
      const response = await adminService.downloadScoresCSV(selectedTestId);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      
      // Create download link
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `test-scores-${selectedTestId}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV downloaded successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download CSV');
    } finally {
      setDownloadingCSV(false);
    }
  };

  const selectedTest = tests.find((t) => t.id === parseInt(selectedTestId));

  if (loading) return <Spinner className="min-h-[60vh]" size="lg" />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Submissions</h1>
        <p className="text-text-light mt-1">View test submissions and release results</p>
      </div>

      <Card className="mb-6">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Select label="Select Test" value={selectedTestId} onChange={handleTestChange}>
              <option value="">Choose a test...</option>
              {tests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.title} — {test.assignedTeamName} ({roleLabel(test.assignedRole)})
                </option>
              ))}
            </Select>
          </div>
          {selectedTest && !selectedTest.resultsReleased && submissions.length > 0 && (
            <Button onClick={handleRelease} loading={releasing} variant="success">
              <Send className="w-4 h-4 mr-2" />
              Release Results
            </Button>
          )}
          {selectedTest && (
            <Button onClick={handleDownloadCSV} loading={downloadingCSV}>
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          )}
        </div>
      </Card>

      {selectedTestId && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>
              Submissions ({submissions.length})
            </CardTitle>
            {selectedTest?.resultsReleased && (
              <Badge variant="success">Results Released</Badge>
            )}
          </div>

          {loadingSubs ? (
            <Spinner className="py-8" />
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-text-light mx-auto mb-3" />
              <p className="text-text-light">No submissions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-text-light">User</th>
                    <th className="text-left py-3 px-2 font-medium text-text-light">Email</th>
                    <th className="text-left py-3 px-2 font-medium text-text-light">Score</th>
                    <th className="text-left py-3 px-2 font-medium text-text-light">Duration</th>
                    <th className="text-left py-3 px-2 font-medium text-text-light">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => {
                    const duration = sub.startTime && sub.endTime
                      ? Math.round((new Date(sub.endTime) - new Date(sub.startTime)) / 60000)
                      : '-';
                    return (
                      <tr key={sub.id} className="border-b border-border/50 hover:bg-gray-50">
                        <td className="py-3 px-2 font-medium">{sub.userName}</td>
                        <td className="py-3 px-2 text-text-light">{sub.userEmail}</td>
                        <td className="py-3 px-2">
                          <Badge variant={sub.score >= sub.totalMarks * 0.7 ? 'success' : sub.score >= sub.totalMarks * 0.4 ? 'warning' : 'danger'}>
                            {sub.score}/{sub.totalMarks}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-text-light">{duration} min</td>
                        <td className="py-3 px-2 text-text-light">
                          {sub.endTime ? new Date(sub.endTime).toLocaleString() : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
