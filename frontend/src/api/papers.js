import api from "./client";

export const generatePaper = async (payload) => {
  const res = await api.post("/api/papers/generate", payload);
  return res.data;
};

export const listPapers = async (filters = {}) => {
  const res = await api.get("/api/papers/", { params: filters });
  return res.data;
};

export const getPaper = async (id) => {
  const res = await api.get(`/api/papers/${id}`);
  return res.data;
};

export const downloadPaper = async (id, answerKey = false, template = "standard") => {
  const res = await api.get(`/api/papers/${id}/download`, {
    params: { answer_key: answerKey, template },
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `paper_${id}_${template}.pdf`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const updatePaper = async (id, data) => {
  const res = await api.patch(`/api/papers/${id}`, data);
  return res.data;
};

export const deletePaper = async (id) => {
  await api.delete(`/api/papers/${id}`);
};
