import { useState } from "react";
import Navbar from "./components/Navbar";
import FolderSelector from "./components/FolderSelector";
import ScanOptions from "./components/ScanOptions";
import ImageList from "./components/ImageList";
import "./App.css";
import axios from "axios";

function App() {
  const [images, setImages] = useState([]);
  const [threshold, setThreshold] = useState(0.5); // Default ORB threshold
  const [folderPath, setFolderPath] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const handleScan = async () => {
    if (!folderPath) {
      showAlert("Please select a folder first!");
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("Sending request with folder:", folderPath, "and threshold:", threshold);
      const response = await axios.post("http://localhost:5002/scan", {
        folder_path: folderPath,
        threshold: threshold, // Send threshold value to backend
      });
      setImages(response.data);
    } catch (error) {
      console.error("Error scanning images:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        showAlert(`Error: ${error.response.data.error || "Unknown error"}`);
      } else {
        showAlert("An error occurred during scanning.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const showAlert = (message) => {
    setAlertMessage(message);
  };

  const closeAlert = () => {
    setAlertMessage(null);
  };


  return (
    <div className="app-container">
      <div className="main-content">
        <Navbar />
        <FolderSelector onScan={setFolderPath} />
        <ScanOptions onOptionSelect={setThreshold} onScan={handleScan} />
        <ImageList images={images} onImagesUpdate={setImages} />
      </div>
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p className="loading-text">Scanning for duplicate images...</p>
          </div>
        </div>
      )}
      
      {alertMessage && (
        <div className="alert-overlay" onClick={closeAlert}>
          <div className="alert-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="alert-title">Notice</h3>
            <p className="alert-message">{alertMessage}</p>
            <button onClick={closeAlert} className="glass-button glass-button-primary alert-button">
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
