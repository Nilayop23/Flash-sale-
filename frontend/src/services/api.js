const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function apiRequest(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new Error(
      "Cannot connect to FastAPI. Check whether the backend is running."
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      data?.detail || `Request failed with status ${response.status}`
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

export function postJSON(path, payload) {
  return apiRequest(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}