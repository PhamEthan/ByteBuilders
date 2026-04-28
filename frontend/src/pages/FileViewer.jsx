import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../css/FileViewer.css';
import { deleteFile, fetchFiles, uploadFile } from '../api/fileViewer';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
  'video/mp4', 'video/quicktime',
];

const CATEGORIES = [
  'All',
  'Medical Records',
  'Medications',
  'Care Plans',
  'Photos & Videos',
  'Insurance & Billing',
  'Emergency Contacts',
  'Daily Reports',
  'Certifications',
  'Client Profile',
  'Other',
];

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getFileIcon(fileType, fileName) {
  if (fileType.startsWith('image/')) return 'IMG';
  if (fileType.includes('pdf')) return 'PDF';
  if (fileType.includes('word') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'DOC';
  if (fileType.includes('excel') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return 'XLS';
  if (fileType.startsWith('video/')) return 'VID';
  if (fileType.includes('text') || fileType.includes('csv')) return 'TXT';
  return 'FILE';
}

function canPreview(file) {
  return file.type.startsWith('image/') || file.type === 'application/pdf' || file.type.startsWith('video/') || file.type.includes('text') || file.type.includes('csv');
}

function FileViewer() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFileCategory, setSelectedFileCategory] = useState('Medical Records');
  const [fileNote, setFileNote] = useState('');
  const [pageError, setPageError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fileInputRef = useRef();
  const dragCounter = useRef(0);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = useMemo(() => {
    let filtered = files;
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(file => file.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(q) ||
        (file.note && file.note.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [files, selectedCategory, searchQuery]);

  useEffect(() => {
    let ignore = false;
    async function loadFiles() {
      setIsLoading(true);
      try {
        const fetched = await fetchFiles();
        if (!ignore) setFiles(fetched);
      } catch (error) {
        if (!ignore) setPageError(error.message || 'Unable to load files.');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    loadFiles();
    return () => { ignore = true; };
  }, []);

  async function processFiles(fileList) {
    setIsUploading(true);
    setPageError('');
    try {
      for (const file of fileList) {
        if (file.size > MAX_FILE_SIZE) throw new Error('File too large.');
        if (!ALLOWED_TYPES.includes(file.type)) throw new Error('File type not allowed.');
        await uploadFile({ file, category: selectedFileCategory, note: fileNote });
      }
      const fetched = await fetchFiles();
      setFiles(fetched);
      setFileNote('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      setPageError(error.message || 'Unable to upload files.');
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileUpload(event) {
    void processFiles(event.target.files);
  }

  function handleDragEnter(event) {
    event.preventDefault();
    event.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      void processFiles(event.dataTransfer.files);
      event.dataTransfer.clearData();
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteFile(deleteTarget.id);
      setFiles((previous) => previous.filter((file) => file.id !== deleteTarget.id));
      if (previewFile?.id === deleteTarget.id) setPreviewFile(null);
      setDeleteTarget(null);
      setPageError('');
    } catch (error) {
      setPageError(error.message || 'Unable to delete file.');
    }
  }

  async function downloadCurrentFile(file) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(file.contentUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('Failed to download file');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setPageError('Download failed.');
    }
  }

  return (
    <div className="file-viewer-page">
      <div className="file-viewer">
        <h1>File Viewer</h1>

        {pageError && (
          <div className="upload-errors">
            <p className="upload-error">{pageError}</p>
          </div>
        )}

        <div
          className={`upload-section ${isDragging ? 'drag-active' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <h2>Upload Files</h2>

          <div className="form-group">
            <label htmlFor="category-select">Category</label>
            <select
              id="category-select"
              value={selectedFileCategory}
              onChange={(event) => setSelectedFileCategory(event.target.value)}
              className="category-select"
            >
              {CATEGORIES.filter((category) => category !== 'All').map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="file-note">Note</label>
            <input
              id="file-note"
              type="text"
              value={fileNote}
              onChange={(event) => setFileNote(event.target.value)}
              placeholder="Optional description"
              className="note-input"
            />
          </div>

          <div className="drop-zone">
            <p className="drop-zone-text">
              {isUploading ? 'Uploading files...' : isDragging ? 'Drop files here!' : 'Drag and drop files here, or'}
            </p>
            {!isUploading && (
              <label htmlFor="file-input" className="upload-button">
                Choose Files
              </label>
            )}
            <input
              id="file-input"
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              accept={ALLOWED_TYPES.join(',')}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="filter-section">
          <h3>Filter Files</h3>
          <div className="category-buttons">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="search-sort-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by file name or note"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="files-section">
          <h2>Files ({filteredFiles.length})</h2>

          {isLoading ? (
            <p className="no-files">Loading files...</p>
          ) : filteredFiles.length === 0 ? (
            <p className="no-files">No files found.</p>
          ) : (
            <div className="file-list">
              {filteredFiles.map((file) => (
                <div key={file.id} className="file-card">
                  <div className="file-icon">
                    {file.type.startsWith('image/') ? (
                      <SecureImageThumb file={file} />
                    ) : (
                      <span className="icon-text">{getFileIcon(file.type, file.name)}</span>
                    )}
                  </div>

                  <div className="file-info">
                    <h3>{file.name}</h3>
                    <p className="file-category">{file.category}</p>
                    {file.note && <p className="file-note">{file.note}</p>}
                    <p>Size: {formatFileSize(file.size)} &middot; Uploaded: {file.uploadDate}</p>
                  </div>

                  <div className="file-actions">
                    {canPreview(file) && (
                      <button onClick={() => setPreviewFile(file)} className="view-button">
                        Preview
                      </button>
                    )}
                    <SecureOpenButton file={file} />
                    <button onClick={() => downloadCurrentFile(file)} className="download-button">
                      Download
                    </button>
                    <button onClick={() => setDeleteTarget(file)} className="delete-button">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {previewFile && (
          <div className="modal-overlay" onClick={() => setPreviewFile(null)}>
            <div className="modal-content" onClick={(event) => event.stopPropagation()}>
              <button className="modal-close" onClick={() => setPreviewFile(null)}>x</button>
              <h3>{previewFile.name}</h3>


              {previewFile.type.startsWith('image/') && (
                <SecureImagePreview file={previewFile} />
              )}
              {previewFile.type === 'application/pdf' && (
                <SecureIframePreview file={previewFile} />
              )}
              {previewFile.type.startsWith('video/') && (
                <SecureVideoPreview file={previewFile} />
              )}
              {(previewFile.type.includes('text') || previewFile.type.includes('csv')) && (
                <SecureIframePreview file={previewFile} />
              )}

              <div className="modal-actions">
                <button onClick={() => downloadCurrentFile(previewFile)} className="download-button">Download</button>
                <SecureOpenButton file={previewFile} />


              </div>
            </div>
          </div>
        )}


        {deleteTarget && (
          <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
            <div className="confirm-dialog" onClick={(event) => event.stopPropagation()}>
              <h3>Delete File?</h3>
              <p>Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This cannot be undone.</p>
              <div className="confirm-actions">
                <button className="delete-button" onClick={handleDelete}>Yes, Delete</button>
                <button className="cancel-btn" onClick={() => setDeleteTarget(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- SECURE FILE ACCESS HELPERS ---
function SecureImageThumb({ file }) {
  const [src, setSrc] = React.useState(null);
  React.useEffect(() => {
    let url;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(file.contentUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        setSrc(url);
      } catch {
        setSrc(null);
      }
    })();
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [file.contentUrl]);
  if (!src) return <span className="icon-text">IMG</span>;
  return <img src={src} alt={file.name} className="thumb" />;
}

function SecureImagePreview({ file }) {
  const [src, setSrc] = React.useState(null);
  React.useEffect(() => {
    let url;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(file.contentUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        setSrc(url);
      } catch {
        setSrc(null);
      }
    })();
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [file.contentUrl]);
  if (!src) return <div>Unable to preview image.</div>;
  return <img src={src} alt={file.name} className="preview-image" />;
}

function SecureIframePreview({ file }) {
  const [src, setSrc] = React.useState(null);
  React.useEffect(() => {
    let url;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(file.contentUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        setSrc(url);
      } catch {
        setSrc(null);
      }
    })();
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [file.contentUrl]);
  if (!src) return <div>Unable to preview file.</div>;
  return <iframe src={src} title={file.name} className="preview-pdf" />;
}

function SecureVideoPreview({ file }) {
  const [src, setSrc] = React.useState(null);
  React.useEffect(() => {
    let url;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(file.contentUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        setSrc(url);
      } catch {
        setSrc(null);
      }
    })();
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [file.contentUrl]);
  if (!src) return <div>Unable to preview video.</div>;
  return <video src={src} controls className="preview-video">Your browser does not support the video tag.</video>;
}

function SecureOpenButton({ file }) {
  const [blobUrl, setBlobUrl] = React.useState(null);
  React.useEffect(() => {
    let url;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(file.contentUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch {
        setBlobUrl(null);
      }
    })();
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [file.contentUrl]);
  if (!blobUrl) return <button disabled className="view-button">Open</button>;
  return <a href={blobUrl} target="_blank" rel="noopener noreferrer" className="view-button">Open</a>;
}

export default FileViewer;