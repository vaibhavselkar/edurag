import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listPapers } from "../api/papers";
import { listDocuments } from "../api/documents";
import Layout from "../components/layout/Layout";
import { FileText, BookOpen, Upload, Plus, ArrowRight } from "lucide-react";

const BOARDS = ["CBSE", "ICSE", "Maharashtra"];

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [papers, setPapers] = useState([]);
  const [docCount, setDocCount] = useState(0);

  useEffect(() => {
    listPapers().then(setPapers).catch(() => {});
    if (isAdmin) listDocuments().then((d) => setDocCount(d.length)).catch(() => {});
  }, [isAdmin]);

  const stats = [
    { label: "Papers Generated", value: papers.length, icon: FileText, color: "bg-primary-50 text-primary-700" },
    ...(isAdmin ? [{ label: "Documents Indexed", value: docCount, icon: Upload, color: "bg-green-50 text-green-700" }] : []),
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name} 👋</h1>
          <p className="text-gray-500 mt-1">Generate exam papers powered by AI for CBSE, ICSE, and Maharashtra Board.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link to="/generate" className="card flex items-center gap-4 hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Generate New Paper</h3>
              <p className="text-sm text-gray-500">Select board, subject, topics & marks</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
          </Link>

          <Link to="/papers" className="card flex items-center gap-4 hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">View My Papers</h3>
              <p className="text-sm text-gray-500">Download or review generated papers</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-amber-600 transition-colors" />
          </Link>

          {isAdmin && (
            <Link to="/admin/documents" className="card flex items-center gap-4 hover:shadow-md transition-shadow group">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Manage Documents</h3>
                <p className="text-sm text-gray-500">Upload PDFs for all boards and subjects</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
            </Link>
          )}
        </div>

        {/* Recent papers */}
        {papers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Recent Papers</h2>
              <Link to="/papers" className="text-sm text-primary-600 hover:underline">View all</Link>
            </div>
            <div className="space-y-2">
              {papers.slice(0, 5).map((paper) => (
                <Link
                  key={paper.id}
                  to={`/papers/${paper.id}`}
                  className="card flex items-center gap-4 hover:shadow-md transition-shadow py-3"
                >
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {paper.board} Grade {paper.grade} — {paper.subject}
                    </p>
                    <p className="text-xs text-gray-500">{paper.total_marks} marks • {paper.difficulty}</p>
                  </div>
                  <span className={`badge ${
                    paper.difficulty === "easy" ? "bg-green-100 text-green-700" :
                    paper.difficulty === "hard" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {paper.difficulty}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
