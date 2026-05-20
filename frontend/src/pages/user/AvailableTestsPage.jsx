import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { testService } from '../../services/testService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { BookOpen, Clock, CheckCircle, Lock } from 'lucide-react';

export default function AvailableTestsPage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await testService.getAssignedTests();
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
        <h1 className="text-2xl font-bold text-text">Available Tests</h1>
        <p className="text-text-light mt-1">Tests assigned to your team and role</p>
      </div>

      {tests.length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="w-12 h-12 text-text-light mx-auto mb-3" />
          <p className="text-text-light">No tests assigned to you yet</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => {
            const isClosed = test.resultsReleased && !test.alreadySubmitted;
            
            return (
              <Card key={test.id} className={`hover:shadow-md transition-shadow flex flex-col ${isClosed ? 'opacity-75' : ''}`}>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-text">{test.title}</h3>
                    {test.alreadySubmitted && (
                      <Badge variant="success">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Done
                      </Badge>
                    )}
                    {isClosed && (
                      <Badge className="bg-red-100 text-red-700">
                        <Lock className="w-3 h-3 mr-1" />
                        Closed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-text-light mb-4 line-clamp-3">{test.description}</p>
                  <div className="flex items-center gap-4 text-sm text-text-light mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {test.timeLimitMinutes} min
                    </span>
                    <span>{test.questions?.length || 0} questions</span>
                  </div>
                </div>

                {test.alreadySubmitted ? (
                  <Button variant="secondary" disabled className="w-full">
                    Already Submitted
                  </Button>
                ) : isClosed ? (
                  <Button variant="secondary" disabled className="w-full">
                    Test Closed - Results Released
                  </Button>
                ) : (
                  <Link to={`/dashboard/tests/${test.id}/take`} className="block">
                    <Button className="w-full">Start Test</Button>
                  </Link>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
