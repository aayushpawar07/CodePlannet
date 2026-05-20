import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import Card, { CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { FileText, Clock, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { roleLabel } from '../../utils/roleLabel';

export default function ViewTestsPage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

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

  if (loading) return <Spinner className="min-h-[60vh]" size="lg" />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">All Tests</h1>
        <p className="text-text-light mt-1">{tests.length} tests created</p>
      </div>

      {tests.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="w-12 h-12 text-text-light mx-auto mb-3" />
          <p className="text-text-light">No tests created yet</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => (
            <Card key={test.id}>
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpanded(expanded === test.id ? null : test.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text">{test.title}</h3>
                    <p className="text-sm text-text-light">{test.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="primary">{roleLabel(test.assignedRole)}</Badge>
                  <Badge variant="info">{test.assignedTeamName}</Badge>
                  <Badge variant={test.resultsReleased ? 'success' : 'warning'}>
                    {test.resultsReleased ? 'Released' : 'Pending'}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-text-light">
                    <Clock className="w-4 h-4" />
                    {test.timeLimitMinutes}m
                  </div>
                  {expanded === test.id ? (
                    <ChevronUp className="w-5 h-5 text-text-light" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-text-light" />
                  )}
                </div>
              </div>

              {expanded === test.id && test.questions && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  {test.questions.map((q, i) => (
                    <div key={q.id} className="bg-gray-50 rounded-lg p-4">
                      <p className="font-medium text-sm mb-2">
                        {i + 1}. {q.questionText}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt) => (
                          <div
                            key={opt.id}
                            className={`text-sm px-3 py-1.5 rounded ${
                              opt.isCorrect
                                ? 'bg-emerald-100 text-emerald-700 font-medium'
                                : 'bg-white text-text-light'
                            }`}
                          >
                            {opt.optionText}
                            {opt.isCorrect && ' ✓'}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
