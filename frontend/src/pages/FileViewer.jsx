import React, { useState } from 'react';
import '../css/FileViewer.css';

function FileViewer() {
  // Store uploaded files
  const [files, setFiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [fileNote, setFileNote] = useState('');
  const [selectedFileCategory, setSelectedFileCategory] = useState('Medical Records');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, name, size

  // File categories for caregiving
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

  // Handle file upload with category and notes
  const handleFileUpload = (event) => {
    const newFiles = Array.from(event.target.files);
    
    const fileObjects = newFiles.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      uploadDate: new Date().toLocaleString(),
      category: selectedFileCategory, // Add category
      note: fileNote // Add note/description
    }));

    setFiles([...files, ...fileObjects]);
    setFileNote(''); // Clear note after upload
  };

  // This function deletes a file from the list
  const handleDelete = (fileId) => {
    setFiles(files.filter(file => file.id !== fileId));
  };

  // This function formats file size to be readable
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Get file icon based on type
  const getFileIcon = (fileType, fileName) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('word') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'DOC';
    if (fileType.includes('excel') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return 'XLS';
    if (fileType.includes('video/')) return 'VID';
    return 'FILE';
  };

  // Get count of files per category
  const getCategoryCount = (category) => {
    if (category === 'All') return files.length;
    return files.filter(file => file.category === category).length;
  };

  // Filter and sort files
  let filteredFiles = selectedCategory === 'All' 
    ? files 
    : files.filter(file => file.category === selectedCategory);

  // Apply search filter
  if (searchQuery) {
    filteredFiles = filteredFiles.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (file.note && file.note.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }

  // Sort files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return b.id - a.id;
      case 'date-asc':
        return a.id - b.id;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'size':
        return b.size - a.size;
      default:
        return 0;
    }
  });

  return (
    <div className="file-viewer">
      <h1>Caregiver File Manager</h1>
      
      {/* Upload Section */}
      <div className="upload-section">
        <h2>Upload New File</h2>
        
        {/* Category Selector */}
        <div className="form-group">
          <label htmlFor="category-select">Category:</label>
          <select 
            id="category-select"
            value={selectedFileCategory}
            onChange={(e) => setSelectedFileCategory(e.target.value)}
            className="category-select"
          >
            {categories.filter(cat => cat !== 'All').map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Notes/Description */}
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

        {/* File Input Button */}
        <label htmlFor="file-input" className="upload-button">
          Choose Files
        </label>
        <input
          id="file-input"
          type="file"
          multiple
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Category Filter */}
      <div className="filter-section">
        <h3>Filter by Category:</h3>
        <div className="category-buttons">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            >
              {category} {getCategoryCount(category) > 0 && `(${getCategoryCount(category)})`}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Sort */}
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

      {/* File List Section */}
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
                <div className="file-icon">
                  {getFileIcon(file.type, file.name)}
                </div>
                
                <div className="file-info">
                  <h3>{file.name}</h3>
                  <p className="file-category">Category: {file.category}</p>
                  {file.note && <p className="file-note">Note: {file.note}</p>}
                  <p>Size: {formatFileSize(file.size)}</p>
                  <p>Uploaded: {file.uploadDate}</p>
                </div>
                
                <div className="file-actions">
                  <a 
                    href={file.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="view-button"
                  >
                    View
                  </a>
                  <a 
                    href={file.url} 
                    download={file.name}
                    className="download-button"
                  >
                    Download
                  </a>
                  <button 
                    onClick={() => handleDelete(file.id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FileViewer;
