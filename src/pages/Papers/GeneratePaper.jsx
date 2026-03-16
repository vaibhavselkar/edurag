import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generatePaper } from "../../api/papers";
import { getSubjects, getTopics } from "../../api/documents";
import Layout from "../../components/layout/Layout";
import toast from "react-hot-toast";
import { Sparkles, ChevronDown } from "lucide-react";

const BOARDS = ["CBSE", "ICSE", "Maharashtra"];
const GRADES = ["10", "11", "12"];
const DIFFICULTIES = ["easy", "medium", "hard"];
const QUESTION_TYPES = [
  { value: "MCQ", label: "MCQ (1 mark each)" },
  { value: "short_answer", label: "Short Answer (2-3 marks)" },
  { value: "long_answer", label: "Long Answer (5-8 marks)" },
];

const DURATIONS = [
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
];

export default function GeneratePaper() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);

  const [form, setForm] = useState({
    board: "CBSE",
    grade: "10",
    subject: "",
    topics: [],
    total_marks: 80,
    duration_minutes: 180,
    question_types: ["MCQ", "short_answer", "long_answer"],
    difficulty: "medium",
    include_answer_key: false,
  });

  useEffect(() => {
    if (form.board && form.grade) {
      getSubjects(form.board, form.grade).then(setSubjects).catch(() => setSubjects([]));
      setForm((f) => ({ ...f, subject: "", topics: [] }));
      setAvailableTopics([]);
    }
  }, [form.board, form.grade]);

  useEffect(() => {
    if (form.board && form.grade && form.subject) {
      getTopics(form.board, form.grade, form.subject).then(setAvailableTopics).catch(() => setAvailableTopics([]));
      setForm((f) => ({ ...f, topics: [] }));
    }
  }, [form.subject]);

  const toggleTopic = (topic) => {
    setForm((f) => ({
      ...f,
      topics: f.topics.includes(topic) ? f.topics.filter((t) => t !== topic) : [...f.topics, topic],
    }));
  };

  const toggleQType = (type) => {
    setForm((f) => ({
      ...f,
      question_types: f.question_types.includes(type)
        ? f.question_types.filter((t) => t !== type)
        : [...f.question_types, type],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject) return toast.error("Please select a subject");
    if (form.question_types.length === 0) return toast.error("Select at least one question type");
    if (!form.total_marks || form.total_marks < 10) return toast.error("Total marks must be at least 10");

    setLoading(true);
    const toastId = toast.loading("Generating paper with AI... This may take 15-30 seconds.");
    try {
      const payload = {
        ...form,
        topics: form.topics.length > 0 ? form.topics : null,
      };
      const paper = await generatePaper(payload);
      toast.dismiss(toastId);
      toast.success("Paper generated successfully!");
      navigate(`/papers/${paper.id}`);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.detail || "Failed to generate paper");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Generate Exam Paper</h1>
          <p className="text-gray-500 mt-1">Configure your exam paper settings below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Board & Grade */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900">Board & Grade</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Board</label>
                <select
                  className="input"
                  value={form.board}
                  onChange={(e) => setForm({ ...form, board: e.target.value })}
                >
                  {BOARDS.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Grade</label>
                <select
                  className="input"
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                >
                  {GRADES.map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Subject</label>
              {subjects.length > 0 ? (
                <select
                  className="input"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                >
                  <option value="">Select subject...</option>
                  {subjects.map((s) => <option key={s}>{s}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Science, Mathematics, History"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                />
              )}
              {subjects.length === 0 && form.grade && (
                <p className="text-xs text-amber-600 mt-1">
                  No documents uploaded — AI will generate from its own knowledge.
                </p>
              )}
            </div>
          </div>

          {/* Topics */}
          {availableTopics.length > 0 && (
            <div className="card space-y-3">
              <div>
                <h2 className="font-semibold text-gray-900">Topics</h2>
                <p className="text-xs text-gray-500">Leave unselected to cover all topics.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      form.topics.includes(topic)
                        ? "bg-primary-600 text-white border-primary-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-primary-400"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Marks & Duration */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900">Marks & Duration</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Total Marks</label>
                <input
                  type="number"
                  className="input"
                  value={form.total_marks}
                  min={10}
                  max={500}
                  step={5}
                  onChange={(e) => setForm({ ...form, total_marks: Number(e.target.value) || "" })}
                />
              </div>
              <div>
                <label className="label">Duration</label>
                <select
                  className="input"
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                >
                  {DURATIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Question Types & Difficulty */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900">Question Types</h2>
            <div className="space-y-2">
              {QUESTION_TYPES.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.question_types.includes(value)}
                    onChange={() => toggleQType(value)}
                    className="w-4 h-4 text-primary-600 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="label">Difficulty</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm({ ...form, difficulty: d })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      form.difficulty === d
                        ? d === "easy" ? "bg-green-600 text-white border-green-600"
                          : d === "hard" ? "bg-red-600 text-white border-red-600"
                          : "bg-amber-500 text-white border-amber-500"
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="card">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.include_answer_key}
                onChange={(e) => setForm({ ...form, include_answer_key: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded border-gray-300"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">Include Answer Key</p>
                <p className="text-xs text-gray-500">Attach answers to downloaded PDF</p>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
          >
            <Sparkles className="w-5 h-5" />
            {loading ? "Generating..." : "Generate Paper"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
