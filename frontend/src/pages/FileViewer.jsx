import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../css/FileViewer.css';
import { deleteFile, fetchFiles, uploadFile } from '../api/fileViewer';
import logo from '../assets/becausewecare_logo.jpg';
import pdfIcon from '../assets/pdf.png';
import docIcon from '../assets/doc.png';
import xlsIcon from '../assets/xls.png';
import imgIcon from '../assets/img.png';
import videoIcon from '../assets/video.png';
import txtIcon from '../assets/txt.png';
import fileIcon from '../assets/file.png';

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
  if (fileType.startsWith('image/')) return <img src={imgIcon} alt="img" className="file-type-icon" />;
  if (fileType.includes('pdf')) return <img src={pdfIcon} alt="pdf" className="file-type-icon" />;
  if (fileType.includes('word') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) return <img src={docIcon} alt="doc" className="file-type-icon" />;
  if (fileType.includes('excel') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return <img src={xlsIcon} alt="xls" className="file-type-icon" />;
  if (fileType.startsWith('video/')) return <img src={videoIcon} alt="video" className="file-type-icon" />;
  if (fileType.includes('text') || fileType.includes('csv')) return <img src={txtIcon} alt="txt" className="file-type-icon" />;
  return <img src={fileIcon} alt="file" className="file-type-icon" />;
}

function canPreview(file) {
  return file.type.startsWith('image/') || file.type === 'application/pdf' || file.type.startsWith('video/') || file.type.includes('text') || file.type.includes('csv');
}

function FileViewer({ userRole = "" }) {
  // Header bar with logo
  // Place this above the main file viewer content
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFileCategory, setSelectedFileCategory] = useState('Medical Records');
  // Example patient list for caregivers/admins; in real app, fetch from API
  const [patients, setPatients] = useState([
    'All Patients',
    'Unassigned',
    'John Smith',
    'Mary Johnson',
    'Robert Davis',
    'Linda Wilson',
    'James Brown',
  ]);
  const [selectedPatient, setSelectedPatient] = useState('All Patients');
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
          <h3>Filters</h3>
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
          <div className="filter-dropdowns" style={{ marginTop: 16 }}>
            {(userRole === 'ADMIN' || userRole === 'CAREGIVER') && (
              <div className="filter-group">
                <label htmlFor="patient-select">Patient:</label>
                <select
                  id="patient-select"
                  value={selectedPatient}
                  onChange={e => setSelectedPatient(e.target.value)}
                >
                  {patients.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            )}
            {/* Example: Add more dropdowns for status, tags, etc. for ADMIN */}
            {userRole === 'ADMIN' && (
              <div className="filter-group">
                <label htmlFor="status-select">Status:</label>
                <select id="status-select" defaultValue="All Statuses">
                  <option>All Statuses</option>
                  <option>Active</option>
                  <option>Archived</option>
                </select>
              </div>
            )}
            {/* Patient role: minimal filters */}
            {userRole === 'PATIENT' && (
              <div className="filter-group">
                <label htmlFor="patient-self">Patient:</label>
                <select id="patient-self" disabled>
                  <option>Me</option>
                </select>
              </div>
            )}
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
                <SecureTextPreview file={previewFile} />
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



// Show a snippet of text/csv files in the preview modal
function SecureTextPreview({ file }) {
  const [snippet, setSnippet] = React.useState('Loading...');
  React.useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(file.contentUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) throw new Error();
        const text = await res.text();
        // Show only the first 20 lines or 1000 chars
        const lines = text.split('\n').slice(0, 20).join('\n');
        setSnippet(lines.length > 1000 ? lines.slice(0, 1000) + '\n... (truncated)' : lines);
      } catch {
        setSnippet('Unable to preview text.');
      }
    })();
  }, [file.contentUrl]);
  return <pre className="preview-text" style={{ maxHeight: 400, overflow: 'auto', background: '#f4f4f4', padding: 12 }}>{snippet}</pre>;
}
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