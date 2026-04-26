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
  const [searchQuery, setSearchQuery] = useState('');
  const [previewFile, setPreviewFile] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [pageError, setPageError] = useState('');

  const dragCounter = useRef(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let isActive = true;

    async function loadFiles() {
      try {
        const storedFiles = await fetchFiles();
        if (isActive) {
          setFiles(storedFiles);
          setPageError('');
        }
      } catch (error) {
        if (isActive) {
          setPageError(error.message || 'Unable to load files. Make sure the file viewer server is running on port 5004.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadFiles();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredFiles = useMemo(() => {
    let nextFiles = files;

    if (selectedCategory !== 'All') {
      nextFiles = nextFiles.filter((file) => file.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      nextFiles = nextFiles.filter((file) => file.name.toLowerCase().includes(query) || (file.note || '').toLowerCase().includes(query));
    }

    return nextFiles;
  }, [files, searchQuery, selectedCategory]);

  function downloadCurrentFile(file) {
    const anchor = document.createElement('a');
    anchor.href = file.downloadUrl;
    anchor.download = file.name;
    anchor.click();
  }

  async function processFiles(rawFiles) {
    const errors = [];
    const validFiles = [];

    Array.from(rawFiles).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}" exceeds the 10 MB limit.`);
        return;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`"${file.name}" is not a supported file type.`);
        return;
      }

      validFiles.push(file);
    });

    setUploadErrors(errors);

    if (validFiles.length === 0) {
      return;
    }

    setIsUploading(true);

    try {
      const uploadedFiles = [];

      for (const file of validFiles) {
        const createdFile = await uploadFile({ file, category: selectedFileCategory, note: fileNote });
        uploadedFiles.push(createdFile);
      }

      setFiles((previous) => [...uploadedFiles, ...previous]);
      setFileNote('');
      setPageError('');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
    if (dragCounter.current === 1) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
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
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteFile(deleteTarget.id);
      setFiles((previous) => previous.filter((file) => file.id !== deleteTarget.id));
      if (previewFile?.id === deleteTarget.id) {
        setPreviewFile(null);
      }
      setDeleteTarget(null);
      setPageError('');
    } catch (error) {
      setPageError(error.message || 'Unable to delete file.');
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

          <p className="upload-hint">Max 10 MB per file. This File Viewer uses its own server on port 5004.</p>

          {uploadErrors.length > 0 && (
            <div className="upload-errors">
              {uploadErrors.map((error) => (
                <p key={error} className="upload-error">{error}</p>
              ))}
            </div>
          )}
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
                      <img src={file.contentUrl} alt={file.name} className="thumb" />
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
                    <a href={file.contentUrl} target="_blank" rel="noopener noreferrer" className="view-button">
                      Open
                    </a>
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
                <img src={previewFile.contentUrl} alt={previewFile.name} className="preview-image" />
              )}
              {previewFile.type === 'application/pdf' && (
                <iframe src={previewFile.contentUrl} title={previewFile.name} className="preview-pdf" />
              )}
              {previewFile.type.startsWith('video/') && (
                <video src={previewFile.contentUrl} controls className="preview-video">
                  Your browser does not support the video tag.
                </video>
              )}
              {(previewFile.type.includes('text') || previewFile.type.includes('csv')) && (
                <iframe src={previewFile.contentUrl} title={previewFile.name} className="preview-pdf" />
              )}

              <div className="modal-actions">
                <button onClick={() => downloadCurrentFile(previewFile)} className="download-button">Download</button>
                <a href={previewFile.contentUrl} target="_blank" rel="noopener noreferrer" className="view-button">Open in New Tab</a>
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

export default FileViewer;