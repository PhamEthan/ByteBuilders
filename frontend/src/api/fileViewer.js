
// API helper functions for file viewer operations
const API_BASE = process.env.REACT_APP_FILEVIEWER_API_BASE || 'http://localhost:5004/files';

// File viewer is intentionally public for local testing.
export function getFetchOptions(options = {}) {
  return {
    ...options,
    headers: {
      ...(options.headers || {}),
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




// Uploads a file with the given category and note
export async function uploadFile({ file, category, note }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  formData.append('note', note);

  // BYPASS CSRF for local development
  const response = await fetch(API_BASE, getFetchOptions({
    method: 'POST',
    body: formData,
    // No CSRF header for local testing
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