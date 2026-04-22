import React, { useState, useRef, useCallback, useMemo } from 'react';
import '../css/FileViewer.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const STORAGE_LIMIT = 100 * 1024 * 1024; // 100 MB total

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

const STATUS_OPTIONS = ['Draft', 'Pending Review', 'Approved', 'Archived'];

const SUGGESTED_TAGS = [
  'urgent', 'needs-signature', 'HIPAA', 'follow-up',
  'completed', 'expired', 'renewal', 'original',
];

// Sample patient list — would come from backend later
const PATIENTS = [
  { id: 'p1', name: 'John Smith' },
  { id: 'p2', name: 'Mary Johnson' },
  { id: 'p3', name: 'Robert Davis' },
  { id: 'p4', name: 'Linda Wilson' },
  { id: 'p5', name: 'James Brown' },
];

function FileViewer() {
  // ── Role-based access (demo toggle — replace with JWT role later) ──
  const [currentRole, setCurrentRole] = useState('CAREGIVER'); // 'ADMIN' | 'CAREGIVER' | 'PATIENT'
  const [currentPatientId, setCurrentPatientId] = useState('p1'); // which patient is logged in (only used when role=PATIENT)
  const isStaff = currentRole === 'ADMIN' || currentRole === 'CAREGIVER';

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
  const [editStatus, setEditStatus] = useState('Draft');
  const [editPatient, setEditPatient] = useState('');
  const [editExpiration, setEditExpiration] = useState('');
  const [editTags, setEditTags] = useState([]);
  const [editVisibility, setEditVisibility] = useState('shared');

  // Drag-and-drop state
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Upload errors
  const [uploadErrors, setUploadErrors] = useState([]);

  // Bulk select state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // View mode: 'list' or 'grid'
  const [viewMode, setViewMode] = useState('list');

  // ── New feature state ──
  // Upload form new fields
  const [uploadPatient, setUploadPatient] = useState('');
  const [uploadExpiration, setUploadExpiration] = useState('');
  const [uploadStatus, setUploadStatus] = useState('Draft');
  const [uploadTags, setUploadTags] = useState([]);
  const [uploadTagInput, setUploadTagInput] = useState('');
  const [uploadVisibility, setUploadVisibility] = useState('shared');

  // Filters
  const [selectedPatientFilter, setSelectedPatientFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [selectedTagFilter, setSelectedTagFilter] = useState('All');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Activity log modal
  const [activityLogFile, setActivityLogFile] = useState(null);

  // Edit tag input
  const [editTagInput, setEditTagInput] = useState('');

  const fileInputRef = useRef(null);

  // Storage usage
  const totalStorage = useMemo(() => files.reduce((sum, f) => sum + f.size, 0), [files]);
  const storagePercent = Math.min((totalStorage / STORAGE_LIMIT) * 100, 100);

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

  // Collect all unique tags across files
  const allTags = useMemo(() => {
    const tagSet = new Set();
    files.forEach((f) => (f.tags || []).forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [files]);

  // Recent files — last 5 by upload time
  const recentFiles = useMemo(() =>
    [...files].sort((a, b) => b.uploadTimestamp - a.uploadTimestamp).slice(0, 5),
    [files]
  );

  // Expiration helper
  const getExpirationStatus = (expDate) => {
    if (!expDate) return null;
    const now = new Date();
    const exp = new Date(expDate);
    const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { label: 'Expired', className: 'exp-expired', days: daysLeft };
    if (daysLeft <= 30) return { label: `Expires in ${daysLeft}d`, className: 'exp-warning', days: daysLeft };
    if (daysLeft <= 90) return { label: `Expires in ${daysLeft}d`, className: 'exp-soon', days: daysLeft };
    return { label: `Expires ${exp.toLocaleDateString()}`, className: 'exp-ok', days: daysLeft };
  };

  // Count expiring soon docs
  const expiringCount = useMemo(() => {
    return files.filter((f) => {
      const s = getExpirationStatus(f.expirationDate);
      return s && s.days <= 30;
    }).length;
  }, [files]);

  // Add activity log entry to a file
  const addActivity = (fileId, action) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, activityLog: [...(f.activityLog || []), { action, timestamp: new Date().toLocaleString() }] }
          : f
      )
    );
  };

  // Toggle favorite
  const toggleFavorite = (fileId) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        const newFav = !f.favorite;
        return {
          ...f,
          favorite: newFav,
          activityLog: [...(f.activityLog || []), { action: newFav ? 'Marked as favorite' : 'Removed from favorites', timestamp: new Date().toLocaleString() }],
        };
      })
    );
  };

  // Toggle visibility
  const toggleVisibility = (fileId) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        const newVis = f.visibility === 'shared' ? 'private' : 'shared';
        return {
          ...f,
          visibility: newVis,
          activityLog: [...(f.activityLog || []), { action: `Changed visibility to ${newVis}`, timestamp: new Date().toLocaleString() }],
        };
      })
    );
  };

  // Change status inline (quick)
  const changeStatus = (fileId, newStatus) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        return {
          ...f,
          status: newStatus,
          activityLog: [...(f.activityLog || []), { action: `Status changed to "${newStatus}"`, timestamp: new Date().toLocaleString() }],
        };
      })
    );
  };

  // Upload tag helpers
  const addUploadTag = (tag) => {
    const t = tag.trim().toLowerCase();
    if (t && !uploadTags.includes(t)) setUploadTags([...uploadTags, t]);
    setUploadTagInput('');
  };

  const removeUploadTag = (tag) => setUploadTags(uploadTags.filter((t) => t !== tag));

  const handleUploadTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addUploadTag(uploadTagInput);
    }
    if (e.key === 'Backspace' && !uploadTagInput && uploadTags.length > 0) {
      setUploadTags(uploadTags.slice(0, -1));
    }
  };

  // Edit tag helpers
  const addEditTag = (tag) => {
    const t = tag.trim().toLowerCase();
    if (t && !editTags.includes(t)) setEditTags([...editTags, t]);
    setEditTagInput('');
  };

  const removeEditTag = (tag) => setEditTags(editTags.filter((t) => t !== tag));

  const handleEditTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEditTag(editTagInput);
    }
    if (e.key === 'Backspace' && !editTagInput && editTags.length > 0) {
      setEditTags(editTags.slice(0, -1));
    }
  };

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

    const now = new Date();
    const fileObjects = valid.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      uploadDate: now.toLocaleString(),
      uploadTimestamp: now.getTime() + index,
      category: selectedFileCategory,
      note: fileNote,
      patientId: isStaff ? uploadPatient : currentPatientId, // patients auto-assign to self
      expirationDate: isStaff ? uploadExpiration : '',
      status: isStaff ? uploadStatus : 'Pending Review', // patient uploads are pending
      tags: isStaff ? [...uploadTags] : [],
      visibility: isStaff ? uploadVisibility : 'shared', // patient uploads always shared
      favorite: false,
      activityLog: [{ action: 'File uploaded', timestamp: now.toLocaleString() }],
    }));

    setFiles((prev) => [...prev, ...fileObjects]);
    setFileNote('');
    setUploadTags([]);
    setUploadTagInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [selectedFileCategory, fileNote, uploadPatient, uploadExpiration, uploadStatus, uploadTags, uploadVisibility, isStaff, currentPatientId]);

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
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(deleteTarget.id); return next; });
    if (previewFile && previewFile.id === deleteTarget.id) setPreviewFile(null);
    setDeleteTarget(null);
  };

  // Bulk select helpers
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedFiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedFiles.map((f) => f.id)));
    }
  };

  const handleBulkDelete = () => {
    setFiles((prev) => {
      prev.forEach((f) => { if (selectedIds.has(f.id)) URL.revokeObjectURL(f.url); });
      return prev.filter((f) => !selectedIds.has(f.id));
    });
    if (previewFile && selectedIds.has(previewFile.id)) setPreviewFile(null);
    setSelectedIds(new Set());
    setBulkDeleteConfirm(false);
  };

  // Export file list as CSV
  const exportCSV = () => {
    const header = 'Name,Category,Patient,Status,Note,Tags,Visibility,Expiration,Size,Uploaded';
    const rows = files.map((f) => {
      const patient = PATIENTS.find((p) => p.id === f.patientId);
      return [
        f.name, f.category, patient ? patient.name : 'Unassigned', f.status,
        f.note || '', (f.tags || []).join('; '), f.visibility, f.expirationDate || '',
        formatFileSize(f.size), f.uploadDate,
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'caregiver-file-list.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Inline edit helpers
  const startEditing = (file) => {
    setEditingId(file.id);
    setEditNote(file.note || '');
    setEditCategory(file.category);
    setEditStatus(file.status || 'Draft');
    setEditPatient(file.patientId || '');
    setEditExpiration(file.expirationDate || '');
    setEditTags([...(file.tags || [])]);
    setEditVisibility(file.visibility || 'shared');
    setEditTagInput('');
  };

  const saveEdit = (fileId) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        return {
          ...f,
          note: editNote,
          category: editCategory,
          status: editStatus,
          patientId: editPatient,
          expirationDate: editExpiration,
          tags: [...editTags],
          visibility: editVisibility,
          activityLog: [...(f.activityLog || []), { action: 'File details edited', timestamp: new Date().toLocaleString() }],
        };
      })
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
    if (fileType.startsWith('image/')) return 'IMG';
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('word') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'DOC';
    if (fileType.includes('excel') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return 'XLS';
    if (fileType.startsWith('video/')) return 'VID';
    if (fileType.includes('text') || fileType.includes('csv')) return 'TXT';
    return 'FILE';
  };

  // Status badge color
  const getStatusClass = (status) => {
    switch (status) {
      case 'Draft': return 'status-draft';
      case 'Pending Review': return 'status-pending';
      case 'Approved': return 'status-approved';
      case 'Archived': return 'status-archived';
      default: return 'status-draft';
    }
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
  let filteredFiles = files;

  // Role-based filtering: patients only see shared files assigned to them
  if (!isStaff) {
    filteredFiles = filteredFiles.filter(
      (f) => f.patientId === currentPatientId && f.visibility === 'shared'
    );
  }

  if (selectedCategory !== 'All') {
    filteredFiles = filteredFiles.filter((f) => f.category === selectedCategory);
  }
  if (isStaff && selectedPatientFilter !== 'All') {
    filteredFiles = filteredFiles.filter((f) => f.patientId === selectedPatientFilter);
  }
  if (isStaff && selectedStatusFilter !== 'All') {
    filteredFiles = filteredFiles.filter((f) => f.status === selectedStatusFilter);
  }
  if (isStaff && selectedTagFilter !== 'All') {
    filteredFiles = filteredFiles.filter((f) => (f.tags || []).includes(selectedTagFilter));
  }
  if (showFavoritesOnly) {
    filteredFiles = filteredFiles.filter((f) => f.favorite);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredFiles = filteredFiles.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.note && f.note.toLowerCase().includes(q)) ||
        (f.tags || []).some((t) => t.includes(q))
    );
  }

  // Sort: favorites always on top, then by chosen sort
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    // Pinned favorites first
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    switch (sortBy) {
      case 'date-desc': return b.id - a.id;
      case 'date-asc': return a.id - b.id;
      case 'name': return a.name.localeCompare(b.name);
      case 'size': return b.size - a.size;
      case 'expiration': {
        if (!a.expirationDate && !b.expirationDate) return 0;
        if (!a.expirationDate) return 1;
        if (!b.expirationDate) return -1;
        return new Date(a.expirationDate) - new Date(b.expirationDate);
      }
      default: return 0;
    }
  });

  // Get patient name helper
  const getPatientName = (patientId) => {
    const p = PATIENTS.find((pt) => pt.id === patientId);
    return p ? p.name : 'Unassigned';
  };

  return (
    <div className="file-viewer-page">
    <div className="file-viewer">
      <h1>Caregiver File Manager</h1>

      {/* ── Demo Role Toggle (replace with real auth later) ── */}
      <div className="role-toggle-bar">
        <div className="role-toggle-group">
          <label>Demo Role:</label>
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value)}
            className="role-select"
          >
            <option value="ADMIN">Admin</option>
            <option value="CAREGIVER">Caregiver</option>
            <option value="PATIENT">Patient</option>
          </select>
        </div>
        {!isStaff && (
          <div className="role-toggle-group">
            <label>Logged in as:</label>
            <select
              value={currentPatientId}
              onChange={(e) => setCurrentPatientId(e.target.value)}
              className="role-select"
            >
              {PATIENTS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
        <span className={`role-badge role-${currentRole.toLowerCase()}`}>
          {currentRole === 'ADMIN' ? 'Admin' : currentRole === 'CAREGIVER' ? 'Caregiver' : `Patient — ${getPatientName(currentPatientId)}`}
        </span>
      </div>

      {/* ── Expiring Documents Banner (staff only) ── */}
      {isStaff && expiringCount > 0 && (
        <div className="expiring-banner">
          <strong>{expiringCount} document{expiringCount > 1 ? 's' : ''}</strong> {expiringCount > 1 ? 'are' : 'is'} expiring within 30 days or already expired!
        </div>
      )}

      {/* ── Recent Files Strip ── */}
      {recentFiles.length > 0 && (
        <div className="recent-section">
          <h3>Recent Files</h3>
          <div className="recent-strip">
            {recentFiles.map((file) => (
              <div
                key={file.id}
                className="recent-card"
                onClick={() => canPreview(file) ? setPreviewFile(file) : window.open(file.url, '_blank')}
              >
                <div className="recent-icon">
                  {file.type.startsWith('image/') ? (
                    <img src={file.url} alt={file.name} className="recent-thumb" />
                  ) : (
                    <span>{getFileIcon(file.type, file.name)}</span>
                  )}
                </div>
                <span className="recent-name" title={file.name}>{file.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Upload Section with Drag & Drop ── */}
      <div
        className={`upload-section ${isDragging ? 'drag-active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <h2>{isStaff ? 'Upload New File' : 'Upload a Document'}</h2>

        <div className="form-row">
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
          {isStaff && (
            <div className="form-group">
              <label htmlFor="patient-select">Assign to Patient:</label>
              <select
                id="patient-select"
                value={uploadPatient}
                onChange={(e) => setUploadPatient(e.target.value)}
                className="category-select"
              >
                <option value="">-- Unassigned --</option>
                {PATIENTS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {isStaff && (
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status-select">Status:</label>
              <select
                id="status-select"
                value={uploadStatus}
                onChange={(e) => setUploadStatus(e.target.value)}
                className="category-select"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="expiration-input">Expiration Date (optional):</label>
              <input
                id="expiration-input"
                type="date"
                value={uploadExpiration}
                onChange={(e) => setUploadExpiration(e.target.value)}
                className="note-input"
              />
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
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
          {isStaff && (
            <div className="form-group">
              <label>Visibility:</label>
              <div className="visibility-toggle">
                <button
                  type="button"
                  className={`vis-btn ${uploadVisibility === 'shared' ? 'vis-active' : ''}`}
                  onClick={() => setUploadVisibility('shared')}
                >Shared</button>
                <button
                  type="button"
                  className={`vis-btn ${uploadVisibility === 'private' ? 'vis-active' : ''}`}
                  onClick={() => setUploadVisibility('private')}
                >Private</button>
              </div>
            </div>
          )}
        </div>

        {/* Tags input — staff only */}
        {isStaff && (
          <div className="form-group">
            <label>Tags:</label>
            <div className="tag-input-wrapper">
              {uploadTags.map((tag) => (
                <span key={tag} className="tag-chip">
                  {tag}
                  <button type="button" onClick={() => removeUploadTag(tag)} className="tag-remove">×</button>
                </span>
              ))}
              <input
                type="text"
                value={uploadTagInput}
                onChange={(e) => setUploadTagInput(e.target.value)}
                onKeyDown={handleUploadTagKeyDown}
                placeholder={uploadTags.length === 0 ? 'Type a tag and press Enter...' : ''}
                className="tag-text-input"
              />
            </div>
            <div className="suggested-tags">
              {SUGGESTED_TAGS.filter((t) => !uploadTags.includes(t)).map((tag) => (
                <button key={tag} type="button" className="suggested-tag" onClick={() => addUploadTag(tag)}>
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="drop-zone">
          <p className="drop-zone-text">
            {isDragging ? 'Drop files here!' : 'Drag & drop files here, or'}
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

      {/* ── Storage Usage Indicator (staff only) ── */}
      {isStaff && files.length > 0 && (
        <div className="storage-section">
          <div className="storage-header">
            <span>Storage Used: {formatFileSize(totalStorage)} / {formatFileSize(STORAGE_LIMIT)}</span>
            <span>{storagePercent.toFixed(1)}%</span>
          </div>
          <div className="storage-bar">
            <div
              className={`storage-fill ${storagePercent > 80 ? 'storage-warning' : ''} ${storagePercent > 95 ? 'storage-critical' : ''}`}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Filters Section ── */}
      <div className="filter-section">
        <h3>Filters</h3>

        {/* Category */}
        <div className="filter-row">
          <label className="filter-label">Category:</label>
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

        {/* Patient + Status + Tag filters — staff only */}
        {isStaff && (
          <div className="filter-dropdowns">
            <div className="filter-group">
              <label>Patient:</label>
              <select
                value={selectedPatientFilter}
                onChange={(e) => setSelectedPatientFilter(e.target.value)}
                className="category-select"
              >
                <option value="All">All Patients</option>
                <option value="">Unassigned</option>
                {PATIENTS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Status:</label>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="category-select"
              >
                <option value="All">All Statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Tag:</label>
              <select
                value={selectedTagFilter}
                onChange={(e) => setSelectedTagFilter(e.target.value)}
                className="category-select"
              >
                <option value="All">All Tags</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="fav-filter-label">
                <input
                  type="checkbox"
                  checked={showFavoritesOnly}
                  onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                />
                Favorites Only
              </label>
            </div>
          </div>
        )}

        {/* Patient: favorites only */}
        {!isStaff && (
          <div className="filter-dropdowns">
            <div className="filter-group">
              <label className="fav-filter-label">
                <input
                  type="checkbox"
                  checked={showFavoritesOnly}
                  onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                />
                Favorites Only
              </label>
            </div>
          </div>
        )}
      </div>

      {/* ── Search, Sort & View Toggle ── */}
      {files.length > 0 && (
        <div className="search-sort-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search files by name, notes, or tags..."
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
              <option value="expiration">Expiration (Soonest)</option>
            </select>
          </div>
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >List</button>
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >Grid</button>
          </div>
        </div>
      )}

      {/* ── Bulk Actions Bar (staff only) ── */}
      {isStaff && files.length > 0 && (
        <div className="bulk-actions-bar">
          <label className="select-all-label">
            <input
              type="checkbox"
              checked={sortedFiles.length > 0 && selectedIds.size === sortedFiles.length}
              onChange={toggleSelectAll}
            />
            Select All
          </label>
          {selectedIds.size > 0 && (
            <div className="bulk-buttons">
              <span className="selected-count">{selectedIds.size} selected</span>
              <button className="delete-button" onClick={() => setBulkDeleteConfirm(true)}>
                Delete Selected
              </button>
            </div>
          )}
          <button className="export-btn" onClick={exportCSV} title="Export file list as CSV">
            Export CSV
          </button>
        </div>
      )}

      {/* ── File List ── */}
      <div className="files-section">
        <h2>{isStaff ? 'Files' : 'My Documents'} ({sortedFiles.length})</h2>

        {sortedFiles.length === 0 ? (
          <p className="no-files">
            {searchQuery
              ? `No files found matching "${searchQuery}"`
              : selectedCategory === 'All'
                ? 'No files uploaded yet. Upload your first file above!'
                : `No files matching the current filters.`}
          </p>
        ) : (
          <div className={`file-list ${viewMode === 'grid' ? 'file-grid' : ''}`}>
            {sortedFiles.map((file) => {
              const expStatus = getExpirationStatus(file.expirationDate);
              return (
                <div key={file.id} className={`file-card ${viewMode === 'grid' ? 'file-card-grid' : ''} ${selectedIds.has(file.id) ? 'file-card-selected' : ''}`}>
                  {/* Checkbox (staff) + Favorite */}
                  <div className="file-card-left">
                    {isStaff && (
                      <input
                        type="checkbox"
                        className="file-checkbox"
                        checked={selectedIds.has(file.id)}
                        onChange={() => toggleSelect(file.id)}
                      />
                    )}
                    <button
                      className={`fav-btn ${file.favorite ? 'fav-active' : ''}`}
                      onClick={() => toggleFavorite(file.id)}
                      title={file.favorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      {file.favorite ? 'Fav' : 'Fav'}
                    </button>
                  </div>

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
                    <div className="file-info-header">
                      <h3>{file.name}</h3>
                      {isStaff && (
                        <span className={`visibility-badge ${file.visibility === 'private' ? 'vis-private' : 'vis-shared'}`}>
                          {file.visibility === 'private' ? 'Private' : 'Shared'}
                        </span>
                      )}
                    </div>

                    {editingId === file.id ? (
                      <div className="edit-form">
                        <div className="edit-row">
                          <div>
                            <label>Category:</label>
                            <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="category-select">
                              {categories.filter((c) => c !== 'All').map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label>Patient:</label>
                            <select value={editPatient} onChange={(e) => setEditPatient(e.target.value)} className="category-select">
                              <option value="">-- Unassigned --</option>
                              {PATIENTS.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="edit-row">
                          <div>
                            <label>Status:</label>
                            <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="category-select">
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label>Expiration:</label>
                            <input type="date" value={editExpiration} onChange={(e) => setEditExpiration(e.target.value)} className="note-input" />
                          </div>
                        </div>
                        <label>Note:</label>
                        <input
                          type="text"
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          className="note-input"
                        />
                        <label>Tags:</label>
                        <div className="tag-input-wrapper">
                          {editTags.map((tag) => (
                            <span key={tag} className="tag-chip">
                              {tag}
                              <button type="button" onClick={() => removeEditTag(tag)} className="tag-remove">×</button>
                            </span>
                          ))}
                          <input
                            type="text"
                            value={editTagInput}
                            onChange={(e) => setEditTagInput(e.target.value)}
                            onKeyDown={handleEditTagKeyDown}
                            placeholder="Add tag..."
                            className="tag-text-input"
                          />
                        </div>
                        <label>Visibility:</label>
                        <div className="visibility-toggle">
                          <button type="button" className={`vis-btn ${editVisibility === 'shared' ? 'vis-active' : ''}`} onClick={() => setEditVisibility('shared')}>Shared</button>
                          <button type="button" className={`vis-btn ${editVisibility === 'private' ? 'vis-active' : ''}`} onClick={() => setEditVisibility('private')}>Private</button>
                        </div>
                        <div className="edit-actions">
                          <button className="save-btn" onClick={() => saveEdit(file.id)}>Save</button>
                          <button className="cancel-btn" onClick={cancelEdit}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="file-meta-row">
                          <span className="file-category">{file.category}</span>
                          <span className={`status-badge ${getStatusClass(file.status)}`}>{file.status}</span>
                          {expStatus && (
                            <span className={`exp-badge ${expStatus.className}`}>{expStatus.label}</span>
                          )}
                        </div>
                        <p className="file-patient">{getPatientName(file.patientId)}</p>
                        {file.note && <p className="file-note">Note: {file.note}</p>}
                        {(file.tags || []).length > 0 && (
                          <div className="file-tags">
                            {file.tags.map((tag) => (
                              <span key={tag} className="tag-display">{tag}</span>
                            ))}
                          </div>
                        )}
                        <p>Size: {formatFileSize(file.size)} &middot; Uploaded: {file.uploadDate}</p>
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
                    {isStaff && (
                      <>
                        <button onClick={() => startEditing(file)} className="edit-button">
                          Edit
                        </button>
                        <button onClick={() => toggleVisibility(file.id)} className="vis-toggle-btn" title="Toggle visibility">
                          {file.visibility === 'shared' ? 'Lock' : 'Share'}
                        </button>
                        <select
                          className="status-quick-select"
                          value={file.status}
                          onChange={(e) => changeStatus(file.id, e.target.value)}
                          title="Change status"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button onClick={() => setActivityLogFile(file)} className="log-btn" title="View activity log">
                          Log
                        </button>
                        <button onClick={() => confirmDelete(file)} className="delete-button">
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
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

      {/* ── Activity Log Modal ── */}
      {activityLogFile && (
        <div className="modal-overlay" onClick={() => setActivityLogFile(null)}>
          <div className="confirm-dialog activity-log-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Activity Log</h3>
            <p className="activity-log-filename">{activityLogFile.name}</p>
            {(activityLogFile.activityLog || []).length === 0 ? (
              <p className="no-activity">No activity recorded.</p>
            ) : (
              <ul className="activity-list">
                {[...(activityLogFile.activityLog || [])].reverse().map((entry, i) => (
                  <li key={i} className="activity-item">
                    <span className="activity-action">{entry.action}</span>
                    <span className="activity-time">{entry.timestamp}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="confirm-actions">
              <button className="cancel-btn" onClick={() => setActivityLogFile(null)}>Close</button>
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

      {/* ── Bulk Delete Confirmation Modal ── */}
      {bulkDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setBulkDeleteConfirm(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete {selectedIds.size} Files?</h3>
            <p>Are you sure you want to delete <strong>{selectedIds.size} file{selectedIds.size > 1 ? 's' : ''}</strong>? This cannot be undone.</p>
            <div className="confirm-actions">
              <button className="delete-button" onClick={handleBulkDelete}>Yes, Delete All</button>
              <button className="cancel-btn" onClick={() => setBulkDeleteConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

export default FileViewer;
