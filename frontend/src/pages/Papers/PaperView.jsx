import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPaper, downloadPaper, updatePaper } from "../../api/papers";
import Layout from "../../components/layout/Layout";
import toast from "react-hot-toast";
import {
  Download, ArrowLeft, Clock, BookOpen, Target,
  Eye, EyeOff, School, User, Pencil, Check, X, Save,
} from "lucide-react";

const diffColor = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

// Renders the actual paper content with template-specific styling
function TemplatePreview({ tplId, paper, sections, withAnswers }) {
  const allSecs = sections || [];

  const QList = ({ questions }) => questions.map((q, qi) => (
    <div key={qi} className="mb-1.5">
      <div className="flex justify-between gap-1">
        <p className="flex-1">{qi + 1}. {q.question}</p>
        <span className="text-gray-400 flex-shrink-0">[{q.marks}]</span>
      </div>
      {q.options && (
        <div className="grid grid-cols-2 pl-3 mt-0.5 gap-x-2">
          {q.options.map((o, oi) => <span key={oi}>{o}</span>)}
        </div>
      )}
      {withAnswers && q.answer && (
        <div className="mt-0.5 pl-3 text-green-700 font-medium">Ans: {q.answer}</div>
      )}
    </div>
  ));

  if (tplId === "standard") return (
    <div className="w-full bg-white shadow border border-gray-200 text-[7.5px] leading-normal font-sans p-4 space-y-2">
      <div className="text-center pb-2 border-b border-gray-300 space-y-0.5">
        {paper.institute_name && <p className="font-bold text-[10px]">{paper.institute_name}</p>}
        {paper.tutor_name && <p className="text-gray-500">{paper.tutor_name}</p>}
        <p className="font-semibold text-[9px]">{paper.board} Board — Grade {paper.grade} — {paper.subject}</p>
        <p>Time: {paper.duration_minutes} min &nbsp;|&nbsp; Total Marks: {paper.total_marks} &nbsp;|&nbsp; Difficulty: {paper.difficulty}</p>
      </div>
      {allSecs.map((sec, si) => (
        <div key={si} className="space-y-1">
          <p className="font-bold uppercase text-[8px]">{sec.section_name}</p>
          <QList questions={sec.questions} />
        </div>
      ))}

    </div>
  );

  if (tplId === "professional") return (
    <div className="w-full bg-white shadow border border-gray-200 text-[7.5px] leading-normal font-sans p-3 space-y-2">
      <div className="flex gap-2 border border-blue-300 rounded p-2 bg-blue-50">
        <div className="flex-1 space-y-0.5">
          {paper.institute_name && <p className="font-bold text-[10px] text-blue-900">{paper.institute_name}</p>}
          {paper.tutor_name && <p className="text-blue-600">{paper.tutor_name}</p>}
          <p className="font-semibold text-[9px] text-blue-800">{paper.board} Board — Grade {paper.grade} — {paper.subject}</p>
          <p className="text-blue-600">Time: {paper.duration_minutes} min &nbsp;|&nbsp; Marks: {paper.total_marks}</p>
        </div>
        <div className="w-10 h-10 border border-blue-200 bg-white rounded flex items-center justify-center text-[6px] text-blue-300 flex-shrink-0">Logo</div>
      </div>
      <div className="border border-gray-300 rounded p-1.5 space-y-1 text-[7px]">
        {["Name", "Roll No", "Date"].map(lbl => (
          <div key={lbl} className="flex gap-2">
            <span className="w-14 font-medium">{lbl}:</span>
            <span className="flex-1 border-b border-gray-400" />
          </div>
        ))}
      </div>
      {allSecs.map((sec, si) => (
        <div key={si} className="space-y-1">
          <p className="font-bold uppercase text-[8px]">{sec.section_name}</p>
          <QList questions={sec.questions} />
        </div>
      ))}

    </div>
  );

  if (tplId === "two_column") return (
    <div className="w-full bg-white shadow border border-gray-200 text-[7.5px] leading-normal font-sans p-4 space-y-2">
      <div className="text-center pb-2 border-b border-gray-300 space-y-0.5">
        {paper.institute_name && <p className="font-bold text-[10px]">{paper.institute_name}</p>}
        <p className="font-semibold text-[9px]">{paper.board} Board — Grade {paper.grade} — {paper.subject}</p>
        <p>Time: {paper.duration_minutes} min &nbsp;|&nbsp; Total Marks: {paper.total_marks}</p>
      </div>
      {allSecs.map((sec, si) => {
        const isMCQ = (sec.type === "MCQ") || sec.section_name?.toLowerCase().includes("mcq") || sec.section_name?.toLowerCase().includes("multiple");
        return (
          <div key={si} className="space-y-1">
            <p className="font-bold uppercase text-[8px]">{sec.section_name}</p>
            {isMCQ ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {sec.questions.map((q, qi) => (
                  <div key={qi}>
                    <p>{qi + 1}. {q.question} <span className="text-gray-400">[{q.marks}]</span></p>
                    {q.options && (
                      <div className="grid grid-cols-2 pl-2 mt-0.5">
                        {q.options.map((o, oi) => <span key={oi}>{o}</span>)}
                      </div>
                    )}
                    {withAnswers && q.answer && <div className="pl-2 text-green-700 font-medium mt-0.5">Ans: {q.answer}</div>}
                  </div>
                ))}
              </div>
            ) : <QList questions={sec.questions} />}
          </div>
        );
      })}

    </div>
  );

  if (tplId === "compact") return (
    <div className="w-full bg-white shadow border border-gray-200 text-[6.5px] leading-tight font-sans p-3 space-y-1">
      <div className="pb-1 border-b border-gray-400 text-center">
        {paper.institute_name && <p className="font-bold text-[8px]">{paper.institute_name}</p>}
        <p>{paper.board} | Grade {paper.grade} | {paper.subject} | {paper.duration_minutes} min | Marks: {paper.total_marks}</p>
      </div>
      {allSecs.map((sec, si) => (
        <div key={si}>
          <p className="font-bold text-[7px] uppercase">{sec.section_name}</p>
          {sec.questions.map((q, qi) => (
            <div key={qi} className="mb-0.5">
              <span className="font-medium">{qi + 1}. {q.question}</span>
              <span className="text-gray-400 ml-1">[{q.marks}]</span>
              {q.options && <span className="ml-1">{q.options.map((o, oi) => <span key={oi} className="mr-1">{o}</span>)}</span>}
              {withAnswers && q.answer && <span className="ml-1 text-green-700 font-medium">Ans: {q.answer}</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  if (tplId === "modern") return (
    <div className="w-full bg-white shadow border border-gray-200 text-[7.5px] leading-normal font-sans overflow-hidden space-y-0">
      <div className="bg-indigo-600 text-white text-center p-3">
        {paper.institute_name && <p className="font-bold text-[11px] uppercase tracking-wide">{paper.institute_name}</p>}
        {paper.tutor_name && <p className="text-indigo-200 text-[8px]">{paper.tutor_name}</p>}
        <p className="text-indigo-100 text-[8px]">{paper.board} — Grade {paper.grade} — {paper.subject}</p>
        <p className="text-indigo-200 text-[7.5px]">Time: {paper.duration_minutes} min &nbsp;·&nbsp; Marks: {paper.total_marks}</p>
      </div>
      <div className="px-4 py-3 space-y-2">
        {allSecs.map((sec, si) => (
          <div key={si} className="space-y-1">
            <div className="bg-indigo-600 text-white font-bold px-2 py-0.5 rounded text-[7.5px]">{sec.section_name}</div>
            <QList questions={sec.questions} />
          </div>
        ))}
  
      </div>
    </div>
  );

  // classic
  return (
    <div className="w-full bg-white shadow border border-gray-200 text-[7.5px] leading-normal font-serif p-4 space-y-2">
      <div className="border-t-2 border-b-2 border-gray-800 py-2 text-center space-y-0.5">
        {paper.institute_name && <p className="font-bold text-[11px] uppercase tracking-widest">{paper.institute_name}</p>}
        {paper.tutor_name && <p>{paper.tutor_name}</p>}
        <p>{paper.board} Board — Grade {paper.grade} — {paper.subject}</p>
        <p>Time: {paper.duration_minutes} min &nbsp;&nbsp;&nbsp; Total Marks: {paper.total_marks}</p>
      </div>
      {allSecs.map((sec, si) => (
        <div key={si}>
          <p className="font-bold uppercase text-[8px] mb-1">{sec.section_name}</p>
          {sec.questions.map((q, qi) => (
            <div key={qi} className="pb-1.5 border-b border-gray-300 mb-1">
              <div className="flex justify-between gap-2">
                <p className="flex-1">{qi + 1}. {q.question}</p>
                <span className="text-gray-500 flex-shrink-0">[{q.marks}]</span>
              </div>
              {q.options && (
                <div className="grid grid-cols-2 pl-4 mt-0.5 gap-x-4">
                  {q.options.map((o, oi) => <span key={oi}>{o.replace(/^[A-D]\.\s*/, "")}</span>)}
                </div>
              )}
              {withAnswers && q.answer && <p className="pl-4 mt-0.5 text-green-700 font-medium">Ans: {q.answer}</p>}
            </div>
          ))}
        </div>
      ))}

    </div>
  );
}

const TEMPLATES = [
  {
    id: "standard",
    name: "Standard",
    desc: "Clean single-column layout with a simple centered header.",
    best: "General use",
    preview: (
      <div className="w-full h-20 bg-white border rounded text-[5px] p-1 overflow-hidden leading-tight">
        <div className="h-2 bg-gray-300 rounded mb-1 w-3/4 mx-auto" />
        <div className="h-1.5 bg-gray-200 rounded mb-1 w-1/2 mx-auto" />
        <div className="h-px bg-gray-400 mb-1" />
        {[1,2,3].map(i=><div key={i} className="h-1 bg-gray-200 rounded mb-0.5 w-full"/>)}
      </div>
    ),
  },
  {
    id: "professional",
    name: "Professional",
    desc: "Formal boxed header with student Name / Roll No / Date fields.",
    best: "School exams",
    preview: (
      <div className="w-full h-20 bg-white border rounded text-[5px] p-1 overflow-hidden leading-tight">
        <div className="flex gap-1 mb-1">
          <div className="flex-1 h-8 bg-blue-100 border border-blue-300 rounded p-0.5">
            <div className="h-1.5 bg-blue-300 rounded mb-0.5 w-full"/>
            <div className="h-1 bg-blue-200 rounded w-3/4"/>
          </div>
          <div className="w-8 h-8 bg-blue-50 border border-blue-200 rounded flex items-center justify-center">
            <div className="h-2 w-2 bg-blue-400 rounded"/>
          </div>
        </div>
        <div className="h-px bg-gray-300 mb-1"/>
        {[1,2].map(i=><div key={i} className="h-1 bg-gray-200 rounded mb-0.5"/>)}
      </div>
    ),
  },
  {
    id: "two_column",
    name: "Two-Column MCQ",
    desc: "MCQ questions laid out in two side-by-side columns to save paper.",
    best: "MCQ-heavy papers",
    preview: (
      <div className="w-full h-20 bg-white border rounded text-[5px] p-1 overflow-hidden leading-tight">
        <div className="h-2 bg-gray-300 rounded mb-1 w-full"/>
        <div className="flex gap-1">
          <div className="flex-1 space-y-0.5">
            {[1,2,3].map(i=><div key={i} className="h-1 bg-gray-200 rounded"/>)}
          </div>
          <div className="flex-1 space-y-0.5">
            {[1,2,3].map(i=><div key={i} className="h-1 bg-gray-200 rounded"/>)}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "compact",
    name: "Compact",
    desc: "Smaller font and tighter line spacing — fits more questions per page.",
    best: "Large papers",
    preview: (
      <div className="w-full h-20 bg-white border rounded text-[5px] p-1 overflow-hidden leading-tight">
        <div className="h-1.5 bg-gray-400 rounded mb-0.5 w-full"/>
        {[1,2,3,4,5,6].map(i=><div key={i} className="h-0.5 bg-gray-200 rounded mb-0.5 w-full"/>)}
      </div>
    ),
  },
  {
    id: "modern",
    name: "Modern",
    desc: "Indigo full-width banner header with colored section title blocks.",
    best: "Competitive exams",
    preview: (
      <div className="w-full h-20 bg-white border rounded text-[5px] p-1 overflow-hidden leading-tight">
        <div className="h-5 bg-indigo-600 rounded mb-1 w-full flex items-center justify-center">
          <div className="h-1.5 bg-white/60 rounded w-2/3"/>
        </div>
        <div className="h-1.5 bg-indigo-500 rounded mb-1 w-full"/>
        {[1,2].map(i=><div key={i} className="h-1 bg-gray-200 rounded mb-0.5"/>)}
      </div>
    ),
  },
  {
    id: "classic",
    name: "Classic / LaTeX",
    desc: "Serif font, university-style with ruled lines between questions.",
    best: "College / university",
    preview: (
      <div className="w-full h-20 bg-white border rounded text-[5px] p-1 overflow-hidden leading-tight font-serif">
        <div className="h-px bg-gray-800 mb-0.5"/>
        <div className="h-1.5 bg-gray-300 rounded mb-0.5 w-3/4 mx-auto"/>
        <div className="h-1 bg-gray-200 rounded mb-0.5 w-1/2 mx-auto"/>
        <div className="h-px bg-gray-800 mb-0.5"/>
        {[1,2,3].map(i=><div key={i} className="h-px bg-gray-300 mb-1"/>)}
      </div>
    ),
  },
];

export default function PaperView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showTopics, setShowTopics] = useState(false);

  // Template modal
  const [templateModal, setTemplateModal] = useState(false);
  const [pendingAnswerKey, setPendingAnswerKey] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedTpl, setSelectedTpl] = useState("standard");
  const activeTpl = TEMPLATES.find(t => t.id === selectedTpl) || TEMPLATES[0];

  // Question editing
  const [sections, setSections] = useState(null); // local editable copy
  const [editIdx, setEditIdx] = useState(null);   // {si, qi}
  const [editBuf, setEditBuf] = useState({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    getPaper(id)
      .then((p) => { setPaper(p); setSections(JSON.parse(JSON.stringify(p.sections || []))); })
      .catch(() => { toast.error("Paper not found"); navigate("/papers"); })
      .finally(() => setLoading(false));
  }, [id]);

  const hasAnswers = paper?.questions?.some((q) => q.answer);

  const handleToggleAnswers = () => {
    if (!showAnswers && !hasAnswers) {
      toast.error("No answers stored — regenerate with 'Include Answer Key' enabled.");
      return;
    }
    setShowAnswers((v) => !v);
  };

  const openTemplateModal = (withAnswers) => {
    setPendingAnswerKey(withAnswers);
    setTemplateModal(true);
  };

  const handleDownload = async (tpl) => {
    setDownloading(true);
    setTemplateModal(false);
    try {
      await downloadPaper(id, pendingAnswerKey, tpl);
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  // ── editing helpers ──────────────────────────────────────────────────────────

  const startEdit = (si, qi) => {
    const q = sections[si].questions[qi];
    setEditBuf({
      question: q.question,
      marks: q.marks,
      topic: q.topic || "",
      answer: q.answer || "",
      options: q.options ? [...q.options] : [],
    });
    setEditIdx({ si, qi });
  };

  const cancelEdit = () => { setEditIdx(null); setEditBuf({}); };

  const commitEdit = () => {
    const { si, qi } = editIdx;
    const updated = sections.map((sec, sIdx) =>
      sIdx !== si ? sec : {
        ...sec,
        questions: sec.questions.map((q, qIdx) =>
          qIdx !== qi ? q : {
            ...q,
            question: editBuf.question,
            marks: Number(editBuf.marks) || q.marks,
            topic: editBuf.topic,
            answer: editBuf.answer || undefined,
            options: editBuf.options.length ? editBuf.options : q.options,
          }
        ),
      }
    );
    setSections(updated);
    setEditIdx(null);
    setEditBuf({});
    setDirty(true);
  };

  const saveAllEdits = async () => {
    setSaving(true);
    try {
      const updated = await updatePaper(id, { sections });
      setPaper(updated);
      setSections(JSON.parse(JSON.stringify(updated.sections || [])));
      setDirty(false);
      toast.success("Changes saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ── render ───────────────────────────────────────────────────────────────────

  if (loading) return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="card animate-pulse h-24 bg-gray-100" />)}
      </div>
    </Layout>
  );
  if (!paper) return null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-4">

        {/* Header card */}
        <div className="card space-y-3">
          <div className="flex items-start gap-3">
            <button onClick={() => navigate(-1)}
              className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              {paper.institute_name && (
                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 mb-0.5">
                  <School className="w-4 h-4 text-primary-600 flex-shrink-0" />
                  {paper.institute_name}
                </div>
              )}
              {paper.tutor_name && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <User className="w-3.5 h-3.5 flex-shrink-0" /> {paper.tutor_name}
                </div>
              )}
              <h1 className="text-xl font-bold text-gray-900">
                {paper.board} Board — Grade {paper.grade} — {paper.subject}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 bg-primary-600 text-white text-sm font-bold px-3 py-1 rounded-lg">
                  <Target className="w-3.5 h-3.5" /> {paper.total_marks} Marks
                </span>
                <span className="badge bg-purple-100 text-purple-700 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {paper.duration_minutes} min
                </span>
                <span className={`badge ${diffColor[paper.difficulty] || "bg-gray-100 text-gray-600"}`}>
                  {paper.difficulty}
                </span>
              </div>
              {paper.topics?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {paper.topics.map((t) => (
                    <span key={t} className="badge bg-gray-100 text-gray-600 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={() => openTemplateModal(false)}
            className="btn-primary flex items-center gap-2" disabled={downloading}>
            <Download className="w-4 h-4" />
            {downloading ? "Downloading..." : "Download Paper"}
          </button>
          <button onClick={() => openTemplateModal(true)}
            className="btn-secondary flex items-center gap-2" disabled={downloading}>
            <Download className="w-4 h-4" /> Download with Answers
          </button>
          <button onClick={handleToggleAnswers}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              showAnswers
                ? "bg-green-600 text-white border-green-600"
                : hasAnswers
                  ? "bg-white text-gray-700 border-gray-300 hover:border-green-400"
                  : "bg-white text-gray-400 border-gray-200 cursor-not-allowed"
            }`}>
            {showAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAnswers ? "Hide Answers" : "Show Answers"}
          </button>
          <button onClick={() => setShowTopics(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              showTopics
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
            }`}>
            <BookOpen className="w-4 h-4" />
            {showTopics ? "Hide Topics" : "Show Topics"}
          </button>
          {dirty && (
            <button onClick={saveAllEdits} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium ml-auto">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
          {!hasAnswers && (
            <p className="w-full text-xs text-amber-600 mt-1">
              No answers stored. Regenerate with "Include Answer Key" to view answers.
            </p>
          )}
        </div>

        {/* Sections */}
        {(sections || []).map((section, si) => (
          <div key={si} className="card space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-semibold text-gray-900">{section.section_name}</h2>
              {section.instructions && (
                <p className="text-sm text-gray-500 italic mt-0.5">{section.instructions}</p>
              )}
            </div>

            <div className="space-y-5">
              {section.questions?.map((q, qi) => {
                const isEditing = editIdx?.si === si && editIdx?.qi === qi;
                return (
                  <div key={qi} className={`flex items-start gap-2 rounded-lg ${isEditing ? "bg-amber-50 p-3 border border-amber-200" : ""}`}>
                    <span className="flex-shrink-0 w-7 h-7 bg-primary-50 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      {qi + 1}
                    </span>

                    <div className="flex-1 space-y-2">
                      {isEditing ? (
                        /* ── Edit form ── */
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Question</label>
                            <textarea rows={3} className="input w-full text-sm resize-none"
                              value={editBuf.question}
                              onChange={(e) => setEditBuf({ ...editBuf, question: e.target.value })} />
                          </div>

                          {editBuf.options.length > 0 && (
                            <div>
                              <label className="text-xs font-medium text-gray-600 mb-1 block">Options</label>
                              <div className="space-y-1">
                                {editBuf.options.map((opt, oi) => (
                                  <div key={oi} className="flex items-center gap-2">
                                    <span className="w-5 h-5 bg-gray-200 rounded text-xs flex items-center justify-center font-medium flex-shrink-0">
                                      {String.fromCharCode(65 + oi)}
                                    </span>
                                    <input type="text" className="input flex-1 text-sm py-1"
                                      value={opt.replace(/^[A-D]\.\s*/, "")}
                                      onChange={(e) => {
                                        const opts = [...editBuf.options];
                                        opts[oi] = `${String.fromCharCode(65 + oi)}. ${e.target.value}`;
                                        setEditBuf({ ...editBuf, options: opts });
                                      }} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-medium text-gray-600 mb-1 block">Marks</label>
                              <input type="number" min={1} className="input w-full text-sm py-1"
                                value={editBuf.marks}
                                onChange={(e) => setEditBuf({ ...editBuf, marks: e.target.value })} />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600 mb-1 block">Topic</label>
                              <input type="text" className="input w-full text-sm py-1"
                                value={editBuf.topic}
                                onChange={(e) => setEditBuf({ ...editBuf, topic: e.target.value })} />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Answer (optional)</label>
                            <input type="text" className="input w-full text-sm py-1"
                              value={editBuf.answer}
                              onChange={(e) => setEditBuf({ ...editBuf, answer: e.target.value })} />
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button onClick={commitEdit}
                              className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700">
                              <Check className="w-3.5 h-3.5" /> Apply
                            </button>
                            <button onClick={cancelEdit}
                              className="flex items-center gap-1 px-3 py-1.5 bg-white text-gray-600 text-xs font-medium border rounded-lg hover:bg-gray-50">
                              <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── Read view ── */
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-gray-900 leading-relaxed">{q.question}</p>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {q.marks}m
                              </span>
                              <button onClick={() => startEdit(si, qi)}
                                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-primary-600">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {q.options && (
                            <ul className="space-y-1">
                              {q.options.map((opt, oi) => (
                                <li key={oi} className="text-sm text-gray-700 flex items-center gap-2">
                                  <span className="w-5 h-5 bg-gray-100 rounded text-xs flex items-center justify-center font-medium flex-shrink-0">
                                    {String.fromCharCode(65 + oi)}
                                  </span>
                                  {opt.replace(/^[A-D]\.\s*/, "")}
                                </li>
                              ))}
                            </ul>
                          )}

                          {showTopics && q.topic && (
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                              <BookOpen className="w-3 h-3" /> {q.topic}
                            </span>
                          )}

                          {showAnswers && q.answer && (
                            <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-xs font-semibold text-green-700">Answer:</p>
                              <p className="text-sm text-green-800 mt-0.5">{q.answer}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Template picker modal ── */}
      {templateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col" style={{maxHeight:"90vh"}}>

              {/* Modal header */}
              <div className="p-5 border-b border-gray-100 flex items-start justify-between flex-shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Choose PDF Template</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {pendingAnswerKey ? "Downloading with answer key" : "Question paper only"} — select a template to preview
                  </p>
                </div>
                <button onClick={() => setTemplateModal(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Two-panel body */}
              <div className="flex flex-1 overflow-hidden min-h-0">

                {/* Left: template list */}
                <div className="w-44 border-r border-gray-100 overflow-y-auto flex-shrink-0 p-2 space-y-1 bg-gray-50">
                  {TEMPLATES.map((tpl) => (
                    <button key={tpl.id} onClick={() => setSelectedTpl(tpl.id)}
                      className={`w-full text-left rounded-xl overflow-hidden border transition-all ${
                        selectedTpl === tpl.id
                          ? "border-primary-500 shadow-sm bg-white"
                          : "border-transparent hover:border-gray-200 hover:bg-white"
                      }`}>
                      <div className="bg-gray-50 p-1.5 border-b border-gray-100">
                        {tpl.preview}
                      </div>
                      <div className="px-2 py-1.5">
                        <p className={`text-xs font-semibold ${selectedTpl === tpl.id ? "text-primary-700" : "text-gray-800"}`}>
                          {tpl.name}
                        </p>
                        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{tpl.best}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Right: large preview + info + download */}
                <div className="flex-1 overflow-y-auto flex flex-col p-5 gap-4">
                  {/* Large preview */}
                  <div className="flex-1 bg-gray-100 rounded-xl p-4 overflow-y-auto flex justify-center">
                    <div className="w-full max-w-md">
                      <TemplatePreview tplId={selectedTpl} paper={paper} sections={sections} withAnswers={pendingAnswerKey} />
                    </div>
                  </div>

                  {/* Template info + download */}
                  <div className="flex-shrink-0 space-y-3">
                    <div>
                      <p className="text-base font-bold text-gray-900">{activeTpl.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{activeTpl.desc}</p>
                      <span className="inline-block mt-1.5 text-xs bg-primary-50 text-primary-700 px-2.5 py-0.5 rounded-full font-medium">
                        Best for: {activeTpl.best}
                      </span>
                    </div>
                    <button onClick={() => handleDownload(selectedTpl)}
                      className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm">
                      <Download className="w-4 h-4" />
                      Download as PDF — {activeTpl.name}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
      )}
    </Layout>
  );
}
