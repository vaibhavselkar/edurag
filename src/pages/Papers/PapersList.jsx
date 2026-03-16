import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPapers, deletePaper } from "../../api/papers";
import Layout from "../../components/layout/Layout";
import { FileText, Download, Trash2, Eye, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { downloadPaper } from "../../api/papers";

const diffColor = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

export default function PapersList() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPapers().then(setPapers).catch(() => toast.error("Failed to load papers")).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this paper?")) return;
    try {
      await deletePaper(id);
      setPapers((p) => p.filter((x) => x.id !== id));
      toast.success("Paper deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleDownload = async (id) => {
    try {
      await downloadPaper(id);
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Papers</h1>
            <p className="text-gray-500 mt-1">{papers.length} paper{papers.length !== 1 ? "s" : ""} generated</p>
          </div>
          <Link to="/generate" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Paper
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse h-20 bg-gray-100" />
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="card text-center py-16">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">No papers yet</h3>
            <p className="text-gray-500 text-sm mb-4">Generate your first exam paper to get started.</p>
            <Link to="/generate" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Generate Paper
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {papers.map((paper) => (
              <div key={paper.id} className="card flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">
                    {paper.board} · Grade {paper.grade} · {paper.subject}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`badge ${diffColor[paper.difficulty] || "bg-gray-100 text-gray-600"}`}>
                      {paper.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">{paper.total_marks} marks</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{paper.duration_minutes} min</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link
                    to={`/papers/${paper.id}`}
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDownload(paper.id)}
                    className="p-2 rounded-lg text-gray-400 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(paper.id)}
                    className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
