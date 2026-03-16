import api from "./client";

export const uploadDocument = async (formData) => {
  const res = await api.post("/api/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const listDocuments = async (filters = {}) => {
  const res = await api.get("/api/documents/", { params: filters });
  return res.data;
};

export const deleteDocument = async (id) => {
  await api.delete(`/api/documents/${id}`);
};

export const getBoards = async () => {
  const res = await api.get("/api/documents/meta/boards");
  return res.data;
};

export const getSubjects = async (board, grade) => {
  const res = await api.get("/api/documents/meta/subjects", { params: { board, grade } });
  return res.data;
};

export const getTopics = async (board, grade, subject) => {
  const res = await api.get("/api/documents/meta/topics", { params: { board, grade, subject } });
  return res.data;
};
