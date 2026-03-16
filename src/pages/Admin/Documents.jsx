import { useState, useEffect, useRef } from "react";
import { uploadDocument, listDocuments, deleteDocument } from "../../api/documents";
import Layout from "../../components/layout/Layout";
import { Upload, Trash2, FileText, Plus, X } from "lucide-react";
import toast from "react-hot-toast";

const BOARDS = ["CBSE", "ICSE", "Maharashtra"];
const GRADES = ["10", "11", "12"];
const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "English", "History", "Geography", "Economics", "Accountancy", "Computer Science"];

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    board: "CBSE",
    grade: "10",
    subject: "Physics",
    topics: [],
    title: "",
    file: null,
  });

  useEffect(() => {
    listDocuments().then(setDocuments).catch(() => toast.error("Failed to load documents"))
      .finally(() => setLoading(false));
  }, []);

  const addTopic = () => {
    const t = topicInput.trim();
    if (t && !form.topics.includes(t)) {
      setForm({ ...form, topics: [...form.topics, t] });
    }
    setTopicInput("");
  };

  const removeTopic = (t) => setForm({ ...form, topics: form.topics.filter((x) => x !== t) });

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.file) return toast.error("Please select a PDF file");
    if (form.topics.length === 0) return toast.error("Add at least one topic");

    setUploading(true);
    const formData = new FormData();
    formData.append("file", form.file);
    formData.append("board", form.board);
    formData.append("grade", form.grade);
    formData.append("subject", form.subject);
    formData.append("topics", JSON.stringify(form.topics));
    formData.append("title", form.title || form.file.name);

    try {
      await uploadDocument(formData);
      toast.success("Document uploaded and indexed!");
      setShowForm(false);
      setForm({ board: "CBSE", grade: "10", subject: "Physics", topics: [], title: "", file: null });
      if (fileRef.current) fileRef.current.value = "";
      listDocuments().then(setDocuments);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this document? This will remove all indexed chunks.")) return;
    try {
      await deleteDocument(id);
      setDocuments((d) => d.filter((x) => x.id !== id));
      toast.success("Document deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-500 mt-1">Manage PDFs for all boards and subjects</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Upload PDF
          </button>
        </div>

        {/* Upload form */}
        {showForm && (
          <div className="card space-y-4 border-primary-200 border-2">
            <h2 className="font-semibold text-gray-900">Upload New Document</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Board</label>
                  <select className="input" value={form.board} onChange={(e) => setForm({ ...form, board: e.target.value })}>
                    {BOARDS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Grade</label>
                  <select className="input" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                    {GRADES.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Subject</label>
                  <select className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                    {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Title (optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. CBSE Physics Chapter 5 - Laws of Motion"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Topics covered in this PDF</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Circular Motion"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTopic(); } }}
                  />
                  <button type="button" onClick={addTopic} className="btn-secondary flex-shrink-0">Add</button>
                </div>
                {form.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.topics.map((t) => (
                      <span key={t} className="badge bg-primary-100 text-primary-700 flex items-center gap-1">
                        {t}
                        <button type="button" onClick={() => removeTopic(t)} className="ml-1 hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="label">PDF File</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf"
                  className="input"
                  onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
                  required
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" disabled={uploading} className="btn-primary flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading & Indexing..." : "Upload & Index"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Documents list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="card animate-pulse h-20 bg-gray-100" />)}
          </div>
        ) : documents.length === 0 ? (
          <div className="card text-center py-16">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-1">No documents yet</h3>
            <p className="text-gray-500 text-sm">Upload your first PDF to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="card flex items-start gap-4">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{doc.title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="badge bg-blue-100 text-blue-700">{doc.board}</span>
                    <span className="badge bg-purple-100 text-purple-700">Grade {doc.grade}</span>
                    <span className="badge bg-green-100 text-green-700">{doc.subject}</span>
                    <span className="text-xs text-gray-400">{doc.chunk_count} chunks</span>
                  </div>
                  {doc.topics?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {doc.topics.map((t) => (
                        <span key={t} className="badge bg-gray-100 text-gray-600">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
