import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPaper, downloadPaper } from "../../api/papers";
import Layout from "../../components/layout/Layout";
import toast from "react-hot-toast";
import { Download, ArrowLeft, Clock, BookOpen, Target } from "lucide-react";

const diffColor = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

export default function PaperView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    getPaper(id).then(setPaper).catch(() => { toast.error("Paper not found"); navigate("/papers"); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async (answerKey = false) => {
    try {
      await downloadPaper(id, answerKey);
    } catch {
      toast.error("Download failed");
    }
  };

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
        {/* Header */}
        <div className="flex items-start gap-3">
          <button onClick={() => navigate(-1)} className="mt-1 p-1.5 rounded-lg hover:bg-gray-200 text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {paper.board} Board — Grade {paper.grade} — {paper.subject}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`badge ${diffColor[paper.difficulty] || "bg-gray-100 text-gray-600"}`}>
                {paper.difficulty}
              </span>
              <span className="badge bg-blue-100 text-blue-700 flex items-center gap-1">
                <Target className="w-3 h-3" /> {paper.total_marks} marks
              </span>
              <span className="badge bg-purple-100 text-purple-700 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {paper.duration_minutes} min
              </span>
            </div>
          </div>
        </div>

        {/* Topics */}
        {paper.topics?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {paper.topics.map((t) => (
              <span key={t} className="badge bg-gray-100 text-gray-700 flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> {t}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => handleDownload(false)} className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" /> Download Paper
          </button>
          <button onClick={() => handleDownload(true)} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> Download with Answers
          </button>
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="btn-secondary"
          >
            {showAnswers ? "Hide Answers" : "Show Answers"}
          </button>
        </div>

        {/* Sections */}
        {(paper.sections || []).map((section, si) => (
          <div key={si} className="card space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-lg font-semibold text-gray-900">{section.section_name}</h2>
              {section.instructions && (
                <p className="text-sm text-gray-500 italic mt-0.5">{section.instructions}</p>
              )}
            </div>

            <div className="space-y-5">
              {section.questions?.map((q, qi) => (
                <div key={qi} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-7 h-7 bg-primary-50 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {qi + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-gray-900 leading-relaxed">{q.question}</p>
                        <span className="flex-shrink-0 text-xs text-gray-400 font-medium">
                          [{q.marks}m]
                        </span>
                      </div>

                      {q.options && (
                        <ul className="mt-2 space-y-1">
                          {q.options.map((opt, oi) => (
                            <li key={oi} className="text-sm text-gray-700 flex items-center gap-2">
                              <span className="w-5 h-5 bg-gray-100 rounded text-xs flex items-center justify-center font-medium">
                                {String.fromCharCode(65 + oi)}
                              </span>
                              {opt.replace(/^[A-D]\.\s*/, "")}
                            </li>
                          ))}
                        </ul>
                      )}

                      {showAnswers && q.answer && (
                        <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-xs font-semibold text-green-700">Answer:</p>
                          <p className="text-sm text-green-800 mt-0.5">{q.answer}</p>
                        </div>
                      )}

                      {q.topic && (
                        <span className="inline-block mt-1 text-xs text-gray-400">
                          Topic: {q.topic}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
