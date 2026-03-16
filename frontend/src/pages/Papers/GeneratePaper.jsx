import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generatePaper } from "../../api/papers";
import { getSubjects } from "../../api/documents";
import Layout from "../../components/layout/Layout";
import toast from "react-hot-toast";
import { Sparkles } from "lucide-react";

const BOARDS = ["CBSE", "ICSE", "Maharashtra"];
const GRADES = ["10", "11", "12"];
const DIFFICULTIES = ["easy", "medium", "hard"];
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

  const [form, setForm] = useState({
    board: "CBSE",
    grade: "10",
    subject: "",
    total_marks: 80,
    duration_minutes: 180,
    difficulty: "medium",
    include_answer_key: false,
    num_mcq: "",
    num_short: "",
    num_long: "",
    marks_per_mcq: 1,
    marks_per_short: 2,
    marks_per_long: 5,
    institute_name: "",
    tutor_name: "",
  });

  // Derive question_types from whichever count fields have a value
  const explicitCounts = form.num_mcq !== "" || form.num_short !== "" || form.num_long !== "";
  const derivedTypes = explicitCounts
    ? [
        ...(form.num_mcq !== "" && Number(form.num_mcq) > 0 ? ["MCQ"] : []),
        ...(form.num_short !== "" && Number(form.num_short) > 0 ? ["short_answer"] : []),
        ...(form.num_long !== "" && Number(form.num_long) > 0 ? ["long_answer"] : []),
      ]
    : ["MCQ", "short_answer", "long_answer"]; // all types for total_marks mode

  // Auto-calculate total marks from counts × marks-per-question
  const computedMarks = explicitCounts
    ? (Number(form.num_mcq) || 0) * (form.marks_per_mcq || 1)
      + (Number(form.num_short) || 0) * (form.marks_per_short || 2)
      + (Number(form.num_long) || 0) * (form.marks_per_long || 5)
    : null;

  useEffect(() => {
    if (form.board && form.grade) {
      getSubjects(form.board, form.grade).then(setSubjects).catch(() => setSubjects([]));
      setForm((f) => ({ ...f, subject: "" }));
    }
  }, [form.board, form.grade]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject) return toast.error("Please select a subject");

    const effectiveMarks = computedMarks !== null ? computedMarks : form.total_marks;
    if (!effectiveMarks || effectiveMarks < 1) return toast.error("Total marks must be at least 1");
    if (derivedTypes.length === 0) return toast.error("Enter a count for at least one question type");

    const mcqCount = form.num_mcq !== "" ? Number(form.num_mcq) || 0 : 0;
    const numBatches = Math.ceil(mcqCount / 50);
    const loadingMsg = mcqCount > 50
      ? `Generating ${mcqCount} MCQ in ${numBatches} batches... ~${numBatches * 20}–${numBatches * 30}s`
      : "Generating paper with AI... This may take 15–30 seconds.";

    setLoading(true);
    const toastId = toast.loading(loadingMsg);
    try {
      const payload = {
        board: form.board,
        grade: form.grade,
        subject: form.subject,
        topics: null,
        total_marks: effectiveMarks,
        duration_minutes: form.duration_minutes,
        difficulty: form.difficulty,
        include_answer_key: form.include_answer_key,
        question_types: derivedTypes,
        num_mcq: form.num_mcq !== "" ? Number(form.num_mcq) : null,
        num_short: form.num_short !== "" ? Number(form.num_short) : null,
        num_long: form.num_long !== "" ? Number(form.num_long) : null,
        marks_per_mcq: form.marks_per_mcq,
        marks_per_short: form.marks_per_short,
        marks_per_long: form.marks_per_long,
        institute_name: form.institute_name || null,
        tutor_name: form.tutor_name || null,
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
          {/* Board, Grade & Subject */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900">Board & Grade</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Board</label>
                <select className="input" value={form.board}
                  onChange={(e) => setForm({ ...form, board: e.target.value })}>
                  {BOARDS.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Grade</label>
                <select className="input" value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                  {GRADES.map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Subject</label>
              {subjects.length > 0 ? (
                <select className="input" value={form.subject} required
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  <option value="">Select subject...</option>
                  {subjects.map((s) => <option key={s}>{s}</option>)}
                </select>
              ) : (
                <input type="text" className="input" placeholder="e.g. Science, Mathematics, History"
                  value={form.subject} required
                  onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              )}
              {subjects.length === 0 && form.grade && (
                <p className="text-xs text-amber-600 mt-1">
                  No documents uploaded — AI will generate from its own knowledge.
                </p>
              )}
            </div>
          </div>

          {/* Question Counts */}
          <div className="card space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900">Questions & Marks</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Fill counts to set exact questions — or leave all blank and set Total Marks below.
              </p>
            </div>

            {/* Header */}
            <div className="grid grid-cols-[1fr_80px_16px_80px_16px_64px] gap-2 items-center text-xs text-gray-400 font-medium px-1">
              <span>Type</span>
              <span className="text-center">Questions</span>
              <span />
              <span className="text-center">Marks each</span>
              <span />
              <span className="text-right">Subtotal</span>
            </div>

            {/* MCQ row */}
            <div className="grid grid-cols-[1fr_80px_16px_80px_16px_64px] gap-2 items-center">
              <span className="text-sm text-gray-700">MCQ</span>
              <input type="number" min={1} placeholder="e.g. 40" className="input text-center px-2"
                value={form.num_mcq}
                onChange={(e) => setForm({ ...form, num_mcq: e.target.value })} />
              <span className="text-gray-400 text-center text-sm">×</span>
              <input type="number" min={1} className="input text-center px-2"
                value={form.marks_per_mcq}
                onChange={(e) => setForm({ ...form, marks_per_mcq: Number(e.target.value) || 1 })} />
              <span className="text-gray-400 text-center text-sm">=</span>
              <span className="text-right text-sm font-semibold text-primary-700">
                {form.num_mcq !== "" ? (Number(form.num_mcq) || 0) * (form.marks_per_mcq || 1) : "—"}
              </span>
            </div>

            {/* Short Answer row */}
            <div className="grid grid-cols-[1fr_80px_16px_80px_16px_64px] gap-2 items-center">
              <span className="text-sm text-gray-700">Short Answer</span>
              <input type="number" min={1} placeholder="e.g. 5" className="input text-center px-2"
                value={form.num_short}
                onChange={(e) => setForm({ ...form, num_short: e.target.value })} />
              <span className="text-gray-400 text-center text-sm">×</span>
              <input type="number" min={1} className="input text-center px-2"
                value={form.marks_per_short}
                onChange={(e) => setForm({ ...form, marks_per_short: Number(e.target.value) || 1 })} />
              <span className="text-gray-400 text-center text-sm">=</span>
              <span className="text-right text-sm font-semibold text-primary-700">
                {form.num_short !== "" ? (Number(form.num_short) || 0) * (form.marks_per_short || 2) : "—"}
              </span>
            </div>

            {/* Long Answer row */}
            <div className="grid grid-cols-[1fr_80px_16px_80px_16px_64px] gap-2 items-center">
              <span className="text-sm text-gray-700">Long Answer</span>
              <input type="number" min={1} placeholder="e.g. 3" className="input text-center px-2"
                value={form.num_long}
                onChange={(e) => setForm({ ...form, num_long: e.target.value })} />
              <span className="text-gray-400 text-center text-sm">×</span>
              <input type="number" min={1} className="input text-center px-2"
                value={form.marks_per_long}
                onChange={(e) => setForm({ ...form, marks_per_long: Number(e.target.value) || 1 })} />
              <span className="text-gray-400 text-center text-sm">=</span>
              <span className="text-right text-sm font-semibold text-primary-700">
                {form.num_long !== "" ? (Number(form.num_long) || 0) * (form.marks_per_long || 5) : "—"}
              </span>
            </div>

            {/* Divider + total */}
            <div className="border-t pt-3">
              {explicitCounts ? (
                <div className="flex items-center justify-between bg-primary-50 border border-primary-200 rounded-lg px-4 py-2">
                  <span className="text-sm font-medium text-primary-700">Total Marks (auto-calculated)</span>
                  <span className="text-xl font-bold text-primary-700">{computedMarks}</span>
                </div>
              ) : (
                <div>
                  <label className="label">Total Marks</label>
                  <input type="number" className="input" min={1} step={5}
                    value={form.total_marks}
                    onChange={(e) => setForm({ ...form, total_marks: Number(e.target.value) || "" })} />
                  <p className="text-xs text-gray-400 mt-1">
                    All 3 question types will be auto-distributed across these marks.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Difficulty & Duration */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900">Difficulty & Duration</h2>
            <div>
              <label className="label">Difficulty</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button key={d} type="button" onClick={() => setForm({ ...form, difficulty: d })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      form.difficulty === d
                        ? d === "easy" ? "bg-green-600 text-white border-green-600"
                          : d === "hard" ? "bg-red-600 text-white border-red-600"
                          : "bg-amber-500 text-white border-amber-500"
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                    }`}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Duration</label>
              <select className="input" value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}>
                {DURATIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>

            {/* Institute & Tutor */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900">Paper Header (optional)</h2>
            <div>
              <label className="label">Institute / School Name</label>
              <input type="text" className="input" placeholder="e.g. Delhi Public School"
                value={form.institute_name}
                onChange={(e) => setForm({ ...form, institute_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Tutor / Teacher Name</label>
              <input type="text" className="input" placeholder="e.g. Mr. Sharma"
                value={form.tutor_name}
                onChange={(e) => setForm({ ...form, tutor_name: e.target.value })} />
            </div>
          </div>

          {/* Options */}
          <div className="card">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-primary-600 rounded border-gray-300"
                checked={form.include_answer_key}
                onChange={(e) => setForm({ ...form, include_answer_key: e.target.checked })} />
              <div>
                <p className="text-sm font-medium text-gray-700">Include Answer Key</p>
                <p className="text-xs text-gray-500">Attach answers to downloaded PDF</p>
              </div>
            </label>
          </div>

          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base">
            <Sparkles className="w-5 h-5" />
            {loading ? "Generating..." : "Generate Paper"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
