export async function requestMindMap(apiFetch, paperId, prompt) {
  return apiFetch("/learning/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "mindmap", paper_id: paperId, count: 6, prompt: prompt.trim() }),
  });
}

export async function requestMindMapExpansion(apiFetch, payload) {
  return apiFetch("/learning/mindmap/expand", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
