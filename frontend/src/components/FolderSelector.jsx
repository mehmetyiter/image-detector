import { useState } from "react";
import PropTypes from 'prop-types';
import './FolderSelector.css';

function FolderSelector({ onScan }) {
    const [folderPath, setFolderPath] = useState("");
  
    const handleBrowse = (e) => {
      // Try to get the full path from the file input
      const files = e.target.files;
      if (files && files.length > 0) {
        try {
          // Get the directory containing the file
          const fullPath = files[0].webkitRelativePath;
          const directoryPath = fullPath.split('/')[0];
          
          if (directoryPath) {
            // Store the absolute path if available
            let folderToUse = directoryPath;
            
            // Try to use the directory path directly
            console.log("Selected directory:", folderToUse);
            
            // Update the UI and notify parent
            setFolderPath(folderToUse);
            console.log("Selected Folder (Frontend):", folderToUse);
            onScan(folderToUse);
          }
        } catch (error) {
          console.error("Error getting folder path:", error);
          alert("Could not get folder path. Please try again.");
        }
      }
    };

  return (
    <div className="folder-selector">
      <input
        type="file"
        webkitdirectory="true"
        onChange={handleBrowse}
        style={{ display: "none" }}
        id="folderInput"
      />
      <div className="folder-input-group">
        <button 
          onClick={() => document.getElementById("folderInput").click()}
          className="glass-button glass-button-primary browse-button"
        >
          <span className="browse-button-icon">📁</span>
          Browse Folder
        </button>
        <div className={`folder-path-display ${folderPath ? 'has-path' : ''}`}>
          <span className="folder-label">Selected:</span>
          {folderPath || "No folder selected"}
        </div>
      </div>
    </div>
  );
}

FolderSelector.propTypes = {
  onScan: PropTypes.func.isRequired,
};

export default FolderSelector;
