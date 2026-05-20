import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import toast from 'react-hot-toast';
import { Plus, Trash2, GripVertical, Copy, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CreateTestPage() {
  const [loading, setLoading] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const navigate = useNavigate();
  const [aiForm, setAiForm] = useState({
    role: '',
    techStack: '',
    progress: '',
    questionCount: 10,
  });

  const [form, setForm] = useState({
    title: '',
    description: '',
    timeLimitMinutes: 30,
    assignedRole: '',
    assignedTeamId: '',
    questions: [
      {
        questionText: '',
        options: [
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
        ],
      },
    ],
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await adminService.getAllTeams();
      setTeams(res.data.data || []);
    } catch {
      setTeams([
        { id: 1, name: 'Falconz' },
        { id: 2, name: 'Beyonders' },
        { id: 3, name: 'Eternals' },
        { id: 4, name: "La Masia's" },
        { id: 5, name: 'Ariba' },
      ]);
    }
  };

  const addQuestion = () => {
    setForm({
      ...form,
      questions: [
        ...form.questions,
        {
          questionText: '',
          options: [
            { optionText: '', isCorrect: false },
            { optionText: '', isCorrect: false },
            { optionText: '', isCorrect: false },
            { optionText: '', isCorrect: false },
          ],
        },
      ],
    });
  };

  const removeQuestion = (index) => {
    if (form.questions.length === 1) return;
    setForm({
      ...form,
      questions: form.questions.filter((_, i) => i !== index),
    });
  };

  const updateQuestion = (index, text) => {
    const questions = [...form.questions];
    questions[index].questionText = text;
    setForm({ ...form, questions });
  };

  const updateOption = (qIndex, oIndex, text) => {
    const questions = [...form.questions];
    questions[qIndex].options[oIndex].optionText = text;
    setForm({ ...form, questions });
  };

  const toggleCorrect = (qIndex, oIndex) => {
    const questions = [...form.questions];
    questions[qIndex].options[oIndex].isCorrect = !questions[qIndex].options[oIndex].isCorrect;
    setForm({ ...form, questions });
  };

  const duplicateQuestion = (index) => {
    const questions = [...form.questions];
    const newQuestion = JSON.parse(JSON.stringify(questions[index]));
    questions.splice(index + 1, 0, newQuestion);
    setForm({ ...form, questions });
    toast.success('Question duplicated');
  };

  const openAiModal = () => {
    setAiForm((prev) => ({
      ...prev,
      role: form.assignedRole || prev.role,
    }));
    setAiOpen(true);
  };

  const generateFromAi = async () => {
    const count = Math.min(15, Math.max(1, parseInt(aiForm.questionCount, 10) || 1));
    if (!aiForm.role) {
      toast.error('Select a role for AI generation');
      return;
    }
    if (!aiForm.techStack.trim() || !aiForm.progress.trim()) {
      toast.error('Please provide tech stack and progress description');
      return;
    }

    setAiLoading(true);
    try {
      const res = await adminService.generateAiQuestions({
        role: aiForm.role,
        techStack: aiForm.techStack.trim(),
        progress: aiForm.progress.trim(),
        questionCount: count,
      });

      const items = res.data.data?.questions || [];
      if (items.length === 0) {
        toast.error('AI returned no questions');
        return;
      }

      const questions = items.slice(0, 15).map((item) => {
        const rawOptions = (item.options || []).slice(0, 4);
        const safeIndex = Math.min(
          Math.max(item.correctIndex ?? 0, 0),
          Math.max(rawOptions.length - 1, 0)
        );
        const options = rawOptions.map((opt, idx) => ({
          optionText: opt,
          isCorrect: idx === safeIndex,
        }));

        return {
          questionText: item.question,
          options,
        };
      });

      setForm({
        ...form,
        assignedRole: form.assignedRole || aiForm.role,
        questions,
      });
      setAiOpen(false);
      toast.success('AI questions added. Please review before saving.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.assignedRole || !form.assignedTeamId) {
      toast.error('Please fill all required fields');
      return;
    }

    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.questionText) {
        toast.error(`Question ${i + 1} text is required`);
        return;
      }
      const hasCorrect = q.options.some((o) => o.isCorrect);
      if (!hasCorrect) {
        toast.error(`Question ${i + 1} must have at least one correct answer`);
        return;
      }
      const allFilled = q.options.every((o) => o.optionText);
      if (!allFilled) {
        toast.error(`All options in Question ${i + 1} must be filled`);
        return;
      }
    }

    setLoading(true);
    try {
      await adminService.createTest({
        ...form,
        assignedTeamId: parseInt(form.assignedTeamId),
        timeLimitMinutes: parseInt(form.timeLimitMinutes),
      });
      toast.success('Test created successfully!');
      navigate('/admin/tests');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Assessment</h1>
        <p className="text-gray-600 mt-2">Configure test details and build your questions</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" onClick={openAiModal}>
          Generate with AI
        </Button>
        <span className="text-xs text-gray-500">Max 15 AI questions per request</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Config Panel */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Assessment Configuration</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Title *</label>
              <input
                type="text"
                placeholder="e.g. Advanced Python Programming"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (minutes) *</label>
              <input
                type="number"
                min="1"
                max="180"
                value={form.timeLimitMinutes}
                onChange={(e) => setForm({ ...form, timeLimitMinutes: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Team Assignment *</label>
              <select
                value={form.assignedTeamId}
                onChange={(e) => setForm({ ...form, assignedTeamId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                <option value="">Select a team...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role Requirement *</label>
              <select
                value={form.assignedRole}
                onChange={(e) => setForm({ ...form, assignedRole: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                <option value="">Select a role...</option>
                <option value="TRAINEE">Trainee</option>
                <option value="INTERN">Intern</option>
                <option value="PPO">Full-time</option>
                <option value="TL">Team Lead</option>
                <option value="TR">Team Representative</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              placeholder="Add details about this assessment..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
              rows="3"
            />
          </div>
        </div>

        {/* Questions Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">{form.questions.length}</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {form.questions.map((question, qIndex) => {
              const hasCorrectAnswer = question.options.some(o => o.isCorrect);
              const allOptionsFilled = question.options.every(o => o.optionText);

              return (
                <div key={qIndex} className="p-6">
                  {/* Question Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-600">{qIndex + 1}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-600">Question {qIndex + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasCorrectAnswer && allOptionsFilled && (
                        <div className="p-1 rounded-lg bg-green-100">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                      )}
                      {form.questions.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => duplicateQuestion(qIndex)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Duplicate question"
                          >
                            <Copy className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeQuestion(qIndex)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete question"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="mb-4">
                    <textarea
                      placeholder="Enter question text..."
                      value={question.questionText}
                      onChange={(e) => updateQuestion(qIndex, e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                      rows="2"
                    />
                  </div>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                        <div className="mt-2.5">
                          <input
                            type="checkbox"
                            checked={option.isCorrect}
                            onChange={() => toggleCorrect(qIndex, oIndex)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                            title="Mark as correct"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                            Option {String.fromCharCode(65 + oIndex)}
                          </label>
                          <input
                            type="text"
                            placeholder={`Enter option ${String.fromCharCode(65 + oIndex)}`}
                            value={option.optionText}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            className="w-full px-2 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {!hasCorrectAnswer && (
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-800">⚠️ Mark at least one answer as correct</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Question Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={addQuestion}
            className="px-6 py-2.5 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Question
          </button>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/admin/tests')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Assessment
          </Button>
        </div>
      </form>

      {aiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">AI Question Generator</h3>
              <button
                type="button"
                onClick={() => setAiOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Candidate Role *</label>
                <select
                  value={aiForm.role}
                  onChange={(e) => setAiForm({ ...aiForm, role: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="">Select role...</option>
                  <option value="TRAINEE">Trainee</option>
                  <option value="INTERN">Intern</option>
                  <option value="PPO">Full-time</option>
                  <option value="TL">Team Lead</option>
                  <option value="TR">Team Representative</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tech Stack *</label>
                <input
                  type="text"
                  value={aiForm.techStack}
                  onChange={(e) => setAiForm({ ...aiForm, techStack: e.target.value })}
                  placeholder="e.g., Java, Spring Boot, MySQL, REST"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Progress / Level *</label>
                <textarea
                  rows="3"
                  value={aiForm.progress}
                  onChange={(e) => setAiForm({ ...aiForm, progress: e.target.value })}
                  placeholder="Describe current progress and topics covered"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions (max 15)</label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={aiForm.questionCount}
                  onChange={(e) => setAiForm({ ...aiForm, questionCount: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setAiOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={generateFromAi} loading={aiLoading}>
                Generate Questions
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
