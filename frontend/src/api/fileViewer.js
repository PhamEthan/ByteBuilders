const API_BASE = 'http://localhost:5004/files';

async function parseJson(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
}

export async function fetchFiles() {
  const response = await fetch(API_BASE);
  return parseJson(response, 'Unable to load files.');
}

export async function uploadFile({ file, category, note }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  formData.append('note', note);

  const response = await fetch(API_BASE, {
    method: 'POST',
    body: formData,
  });

  return parseJson(response, 'Unable to upload file.');
}

export async function deleteFile(fileId) {
  const response = await fetch(`${API_BASE}/${fileId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Unable to delete file.');
  }
}