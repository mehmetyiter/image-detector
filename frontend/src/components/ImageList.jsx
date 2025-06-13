import { useState, useEffect } from "react";
import axios from "axios";
import PropTypes from 'prop-types';
import './ImageList.css';

function ImageList({ images, onImagesUpdate }) {
  const [groupedImages, setGroupedImages] = useState({ originals: [], allDuplicates: [] });
  const [selectedOriginals, setSelectedOriginals] = useState([]);
  const [selectedDuplicates, setSelectedDuplicates] = useState([]);
  const [showNewScanDialog, setShowNewScanDialog] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false); // Track if a scan has been completed

  useEffect(() => {
    // Group images by originals and collect all duplicates
    const grouped = { originals: [], allDuplicates: [] };
    const seenImages = new Set();
    const seenDuplicates = new Set();

    images.forEach((pair) => {
      const original = pair.path;
      const duplicate = pair.comparedWith;

      // Add original if not seen
      if (!seenImages.has(original)) {
        grouped.originals.push(original);
        seenImages.add(original);
      }

      // Add duplicate to all duplicates list if not seen
      if (!seenDuplicates.has(duplicate)) {
        grouped.allDuplicates.push({
          path: duplicate,
          similarity: pair.similarity,
          originalPath: original
        });
        seenDuplicates.add(duplicate);
      }
    });

    setGroupedImages(grouped);

    // Show dialog only if scan is completed and no images or only a few remain
    if (scanCompleted && (images.length === 0 || (grouped.originals.length === 0 && grouped.allDuplicates.length === 0))) {
      setShowNewScanDialog(true);
    }
  }, [images, scanCompleted]);

  const handleSelectAllOriginals = () => {
      if (selectedOriginals.length === groupedImages.originals.length) {
        setSelectedOriginals([]); // Deselect all
      } else {
        setSelectedOriginals(groupedImages.originals); // Select all
      }
    };
  
    const handleSelectOriginal = (originalPath) => {
      setSelectedOriginals((prevSelected) =>
        prevSelected.includes(originalPath)
          ? prevSelected.filter((path) => path !== originalPath)
          : [...prevSelected, originalPath]
      );
    };

    const handleSelectAllDuplicates = () => {
      if (selectedDuplicates.length === groupedImages.allDuplicates.length) {
        setSelectedDuplicates([]); // Deselect all
      } else {
        setSelectedDuplicates(groupedImages.allDuplicates.map(d => d.path)); // Select all
      }
    };

    const handleSelectDuplicate = (duplicatePath) => {
      setSelectedDuplicates((prevSelected) =>
        prevSelected.includes(duplicatePath)
          ? prevSelected.filter((path) => path !== duplicatePath)
          : [...prevSelected, duplicatePath]
      );
    };

  const handleDeleteOriginals = async () => {
    if (selectedOriginals.length === 0) {
      alert("No original images selected for deletion");
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedOriginals.length} original image(s)?`)) {
      return;
    }
    
    await deleteImages(selectedOriginals);
  };

  const handleDeleteSelectedDuplicates = async () => {
    if (selectedDuplicates.length === 0) {
      alert("No duplicate images selected for deletion");
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedDuplicates.length} duplicate image(s)?`)) {
      return;
    }
    
    await deleteImages(selectedDuplicates);
  };

  const handleDeleteAllDuplicates = async () => {
    const allDuplicatePaths = groupedImages.allDuplicates.map(d => d.path);
    
    if (allDuplicatePaths.length === 0) {
      alert("No duplicate images to delete");
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ALL ${allDuplicatePaths.length} duplicate image(s)?`)) {
      return;
    }
    
    await deleteImages(allDuplicatePaths);
  };

  const deleteImages = async (imagePaths) => {
    try {
      const response = await axios.post("http://localhost:5002/delete", {
        image_paths: imagePaths
      });
      
      alert(`${response.data.deleted} image(s) deleted successfully. ${response.data.failed} failed.`);
      
      // Update image list by filtering out deleted images
      // Keep pairs where neither image is in the deleted list
      const remainingImages = images.filter(pair => 
        !imagePaths.includes(pair.path) && !imagePaths.includes(pair.comparedWith)
      );
      
      // Clear selections
      setSelectedOriginals([]);
      setSelectedDuplicates([]);
      
      // Update parent component
      if (onImagesUpdate) {
        onImagesUpdate(remainingImages);
      }

      // Mark scan as completed
      setScanCompleted(true);

      // Check if we should show the dialog
      if (remainingImages.length <= 1) {
        setShowNewScanDialog(true);
      }
    } catch (error) {
      console.error("Error deleting images:", error);
      alert("An error occurred while deleting images.");
    }
  };

  const handleNewScan = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.reload();
  };

  if (showNewScanDialog) {
    return (
      <div className="glass-container completion-dialog">
        <h3>Processing completed!</h3>
        <p>Would you like to scan another folder?</p>
        <div className="dialog-buttons">
          <button onClick={handleNewScan} className="glass-button glass-button-primary">
            Yes, New Scan
          </button>
          <button onClick={handleGoHome} className="glass-button">
            No, Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return null; // Don't show anything before scan
  }

  if (groupedImages.originals.length === 0 && groupedImages.allDuplicates.length === 0) {
    return <div className="glass-container empty-state">No duplicate images found.</div>;
  }

  // Only show New Scan button if there are images (scan has been performed)
  return (
    <div className="image-list-container">
      {images.length > 0 && (
        <div className="new-scan-button-container">
          <button onClick={() => setShowNewScanDialog(true)} className="glass-button glass-button-primary">
            New Scan
          </button>
        </div>
      )}

      <div className="columns-container">
        {/* Originals Column */}
        <div className="image-column glass-card">
          <div className="column-header">
            <h3 className="column-title">Original Images ({groupedImages.originals.length})</h3>
          </div>
          <div className="action-buttons">
            <button onClick={handleSelectAllOriginals} className="glass-button">
              {selectedOriginals.length === groupedImages.originals.length ? "Deselect All" : "Select All"}
            </button>
            <button onClick={handleDeleteOriginals} className="glass-button glass-button-danger">
              Delete Selected
            </button>
          </div>
          <div className="image-grid">
            {groupedImages.originals.map((originalPath) => (
              <div key={originalPath} className={`image-card ${selectedOriginals.includes(originalPath) ? 'selected' : ''}`}>
                <div className="image-content">
                  <input
                    type="checkbox"
                    className="glass-checkbox"
                    checked={selectedOriginals.includes(originalPath)}
                    onChange={() => handleSelectOriginal(originalPath)}
                  />
                  <div className="image-thumbnail-container">
                    <img 
                      className="image-thumbnail"
                      src={`http://localhost:5002/image?path=${encodeURIComponent(originalPath)}`}
                      alt={originalPath.split('/').pop()} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='10' text-anchor='middle' dominant-baseline='middle'%3ECannot Display%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <div className="image-info">
                    <div className="image-name">{originalPath.split('/').pop()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* All Duplicates Column */}
        <div className="image-column glass-card">
          <div className="column-header">
            <h3 className="column-title">Duplicate Images ({groupedImages.allDuplicates.length})</h3>
          </div>
          <div className="action-buttons">
            <button onClick={handleSelectAllDuplicates} className="glass-button">
              {selectedDuplicates.length === groupedImages.allDuplicates.length ? "Deselect All" : "Select All"}
            </button>
            <button onClick={handleDeleteSelectedDuplicates} className="glass-button glass-button-danger">
              Delete Selected
            </button>
            <button onClick={handleDeleteAllDuplicates} className="glass-button glass-button-danger">
              Delete All
            </button>
          </div>
          <div className="image-grid">
            {groupedImages.allDuplicates.map((duplicate) => (
              <div key={duplicate.path} className={`image-card ${selectedDuplicates.includes(duplicate.path) ? 'selected' : ''}`}>
                <div className="image-content">
                  <input
                    type="checkbox"
                    className="glass-checkbox"
                    checked={selectedDuplicates.includes(duplicate.path)}
                    onChange={() => handleSelectDuplicate(duplicate.path)}
                  />
                  <div className="image-thumbnail-container duplicate">
                    <img 
                      className="image-thumbnail"
                      src={`http://localhost:5002/image?path=${encodeURIComponent(duplicate.path)}`}
                      alt={duplicate.path.split('/').pop()} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23f0f0f0'/%3E%3Ctext x='40' y='40' font-family='Arial' font-size='8' text-anchor='middle' dominant-baseline='middle'%3ECannot Display%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                  <div className="image-info">
                    <div className="image-name">{duplicate.path.split('/').pop()}</div>
                    <div className="image-meta">
                      <div className="similarity-badge">Similarity: {duplicate.similarity.toFixed(2)}</div>
                      <div>Duplicate of: {duplicate.originalPath.split('/').pop()}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

ImageList.propTypes = {
  images: PropTypes.array.isRequired,
  onImagesUpdate: PropTypes.func.isRequired,
};

export default ImageList;
