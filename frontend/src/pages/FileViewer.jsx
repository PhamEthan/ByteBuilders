import React, { useState, useRef, useCallback } from 'react';
import '../css/FileViewer.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

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

function FileViewer() {
  const [files, setFiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [fileNote, setFileNote] = useState('');
  const [selectedFileCategory, setSelectedFileCategory] = useState('Medical Records');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  // Preview modal state
  const [previewFile, setPreviewFile] = useState(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editNote, setEditNote] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Drag-and-drop state
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Upload errors
  const [uploadErrors, setUploadErrors] = useState([]);

  const fileInputRef = useRef(null);

  const categories = [
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
    'Other'
  ];

  // Validate a single file
  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" exceeds the 10 MB limit (${formatFileSize(file.size)}).`;
    }
    if (ALLOWED_TYPES.length > 0 && !ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" has an unsupported file type (${file.type || 'unknown'}).`;
    }
    return null;
  };

  // Process files from input or drop
  const processFiles = useCallback((rawFiles) => {
    const errors = [];
    const valid = [];

    Array.from(rawFiles).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        valid.push(file);
      }
    });

    if (errors.length) setUploadErrors(errors);
    else setUploadErrors([]);

    if (valid.length === 0) return;

    const fileObjects = valid.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      uploadDate: new Date().toLocaleString(),
      category: selectedFileCategory,
      note: fileNote,
    }));

    setFiles((prev) => [...prev, ...fileObjects]);
    setFileNote('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [selectedFileCategory, fileNote]);

  // File input handler
  const handleFileUpload = (event) => {
    processFiles(event.target.files);
  };

  // Drag-and-drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  // Delete with confirmation
  const confirmDelete = (file) => setDeleteTarget(file);

  const handleDelete = () => {
    if (!deleteTarget) return;
    URL.revokeObjectURL(deleteTarget.url);
    setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
    if (previewFile && previewFile.id === deleteTarget.id) setPreviewFile(null);
    setDeleteTarget(null);
  };

  // Inline edit helpers
  const startEditing = (file) => {
    setEditingId(file.id);
    setEditNote(file.note || '');
    setEditCategory(file.category);
  };

  const saveEdit = (fileId) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, note: editNote, category: editCategory } : f
      )
    );
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  // Format size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // File icon
  const getFileIcon = (fileType, fileName) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) return '📝';
    if (fileType.includes('excel') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return '📊';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.includes('text') || fileType.includes('csv')) return '📃';
    return '📁';
  };

  // Category counts
  const getCategoryCount = (category) => {
    if (category === 'All') return files.length;
    return files.filter((f) => f.category === category).length;
  };

  // Can preview inline?
  const canPreview = (file) =>
    file.type.startsWith('image/') || file.type === 'application/pdf' || file.type.startsWith('video/');

  // Filter + sort
  let filteredFiles =
    selectedCategory === 'All'
      ? files
      : files.filter((f) => f.category === selectedCategory);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredFiles = filteredFiles.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.note && f.note.toLowerCase().includes(q))
    );
  }

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc': return b.id - a.id;
      case 'date-asc': return a.id - b.id;
      case 'name': return a.name.localeCompare(b.name);
      case 'size': return b.size - a.size;
      default: return 0;
    }
  });

  return (
    <div className="file-viewer">
      <h1>Caregiver File Manager</h1>

      {/* ── Upload Section with Drag & Drop ── */}
      <div
        className={`upload-section ${isDragging ? 'drag-active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <h2>Upload New File</h2>

        <div className="form-group">
          <label htmlFor="category-select">Category:</label>
          <select
            id="category-select"
            value={selectedFileCategory}
            onChange={(e) => setSelectedFileCategory(e.target.value)}
            className="category-select"
          >
            {categories.filter((c) => c !== 'All').map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="file-note">Notes (optional):</label>
          <input
            id="file-note"
            type="text"
            value={fileNote}
            onChange={(e) => setFileNote(e.target.value)}
            placeholder="e.g., Lab results from Dr. Smith"
            className="note-input"
          />
        </div>

        <div className="drop-zone">
          <p className="drop-zone-text">
            {isDragging ? '📥  Drop files here!' : 'Drag & drop files here, or'}
          </p>
          {!isDragging && (
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

        <p className="upload-hint">Max 10 MB per file. Images, PDFs, Word, Excel, CSV, text, and video accepted.</p>

        {uploadErrors.length > 0 && (
          <div className="upload-errors">
            {uploadErrors.map((err, i) => (
              <p key={i} className="upload-error">{err}</p>
            ))}
          </div>
        )}
      </div>

      {/* ── Category Filter ── */}
      <div className="filter-section">
        <h3>Filter by Category:</h3>
        <div className="category-buttons">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
            >
              {cat} {getCategoryCount(cat) > 0 && `(${getCategoryCount(cat)})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Search & Sort ── */}
      {files.length > 0 && (
        <div className="search-sort-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search files by name or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="sort-box">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="size">Size (Largest)</option>
            </select>
          </div>
        </div>
      )}

      {/* ── File List ── */}
      <div className="files-section">
        <h2>Files ({sortedFiles.length})</h2>

        {sortedFiles.length === 0 ? (
          <p className="no-files">
            {searchQuery
              ? `No files found matching "${searchQuery}"`
              : selectedCategory === 'All'
                ? 'No files uploaded yet. Upload your first file above!'
                : `No files in "${selectedCategory}" category.`}
          </p>
        ) : (
          <div className="file-list">
            {sortedFiles.map((file) => (
              <div key={file.id} className="file-card">
                {/* Thumbnail / icon */}
                <div className="file-icon" onClick={() => canPreview(file) && setPreviewFile(file)} style={canPreview(file) ? { cursor: 'pointer' } : {}}>
                  {file.type.startsWith('image/') ? (
                    <img src={file.url} alt={file.name} className="thumb" />
                  ) : (
                    <span className="icon-text">{getFileIcon(file.type, file.name)}</span>
                  )}
                </div>

                {/* File details — inline editing or read-only */}
                <div className="file-info">
                  <h3>{file.name}</h3>

                  {editingId === file.id ? (
                    <div className="edit-form">
                      <label>Category:</label>
                      <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="category-select">
                        {categories.filter((c) => c !== 'All').map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <label>Note:</label>
                      <input
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        className="note-input"
                      />
                      <div className="edit-actions">
                        <button className="save-btn" onClick={() => saveEdit(file.id)}>Save</button>
                        <button className="cancel-btn" onClick={cancelEdit}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="file-category">{file.category}</p>
                      {file.note && <p className="file-note">Note: {file.note}</p>}
                      <p>Size: {formatFileSize(file.size)}</p>
                      <p>Uploaded: {file.uploadDate}</p>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="file-actions">
                  {canPreview(file) && (
                    <button onClick={() => setPreviewFile(file)} className="view-button">
                      Preview
                    </button>
                  )}
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="view-button">
                    Open
                  </a>
                  <a href={file.url} download={file.name} className="download-button">
                    Download
                  </a>
                  <button onClick={() => startEditing(file)} className="edit-button">
                    Edit
                  </button>
                  <button onClick={() => confirmDelete(file)} className="delete-button">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Preview Modal ── */}
      {previewFile && (
        <div className="modal-overlay" onClick={() => setPreviewFile(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPreviewFile(null)}>✕</button>
            <h3>{previewFile.name}</h3>

            {previewFile.type.startsWith('image/') && (
              <img src={previewFile.url} alt={previewFile.name} className="preview-image" />
            )}
            {previewFile.type === 'application/pdf' && (
              <iframe src={previewFile.url} title={previewFile.name} className="preview-pdf" />
            )}
            {previewFile.type.startsWith('video/') && (
              <video src={previewFile.url} controls className="preview-video">
                Your browser does not support the video tag.
              </video>
            )}

            <div className="modal-actions">
              <a href={previewFile.url} download={previewFile.name} className="download-button">Download</a>
              <a href={previewFile.url} target="_blank" rel="noopener noreferrer" className="view-button">Open in New Tab</a>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
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
  );
}

export default FileViewer;
