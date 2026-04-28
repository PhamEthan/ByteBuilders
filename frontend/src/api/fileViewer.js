
// API helper functions for file viewer operations
const API_BASE = process.env.REACT_APP_FILEVIEWER_API_BASE || 'http://localhost:5003/files';

// Helper to get auth headers with token from localStorage
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Helper to get fetch options with credentials and auth headers
export function getFetchOptions(options = {}) {
  return {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.headers || {}),
      ...getAuthHeaders(),
    },
  };
}

// Helper to parse JSON response and handle errors
async function parseJson(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
}

// Fetches list of files for the current user
export async function fetchFiles() {
  const response = await fetch(API_BASE, getFetchOptions());
  return parseJson(response, 'Unable to load files.');
}



// Helper to fetch CSRF token from backend
async function fetchCsrfToken() {
  const res = await fetch(API_BASE.replace(/\/files$/, '/csrf-token'), {
    credentials: 'include',
  });
  const data = await res.json();
  return data.csrfToken;
}

// Uploads a file with the given category and note
export async function uploadFile({ file, category, note }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  formData.append('note', note);

  // Fetch CSRF token and include in header
  const csrfToken = await fetchCsrfToken();

  const response = await fetch(API_BASE, getFetchOptions({
    method: 'POST',
    body: formData,
    headers: {
      'x-csrf-token': csrfToken,
    },
  }));

  return parseJson(response, 'Unable to upload file.');
}


// Deletes a file by its ID
export async function deleteFile(fileId) {
  const response = await fetch(`${API_BASE}/${fileId}`, getFetchOptions({
    method: 'DELETE',
  }));

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Unable to delete file.');
  }
}