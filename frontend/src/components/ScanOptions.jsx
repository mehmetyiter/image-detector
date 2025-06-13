import { useState } from "react";
import PropTypes from 'prop-types';
import './ScanOptions.css';

function ScanOptions({ onOptionSelect, onScan }) {
  const [selectedOption, setSelectedOption] = useState(0.5); // Default threshold

  const handleOptionChange = (e) => {
    const value = parseFloat(e.target.value);
    setSelectedOption(value);
    onOptionSelect(value); // Update the threshold in the parent component
  };

  const getScanInfo = () => {
    switch(selectedOption) {
      case 0.9:
        return "Fast scan for nearly identical images (90% similarity)";
      case 0.7:
        return "Balanced scan for similar images (70% similarity)";
      case 0.5:
        return "Thorough scan for loosely similar images (50% similarity)";
      default:
        return "";
    }
  };

  return (
    <div className="scan-options glass-card">
      <div className="scan-controls">
        <div className="scan-depth-group">
          <label htmlFor="scanOptions" className="scan-label">Scan Depth:</label>
          <select 
            id="scanOptions" 
            onChange={handleOptionChange} 
            value={selectedOption} 
            className="glass-select scan-select"
          >
            <option value={0.9}>Quick Scan</option>
            <option value={0.7}>Detailed Scan</option>
            <option value={0.5}>Deep Scan</option>
          </select>
        </div>
        <button onClick={onScan} className="glass-button glass-button-success scan-button">
          <span className="scan-button-icon">🔍</span>
          Start Scan
        </button>
      </div>
      <div className="scan-info">
        <div className="scan-info-title">Scan Mode:</div>
        {getScanInfo()}
      </div>
    </div>
  );
}

ScanOptions.propTypes = {
  onOptionSelect: PropTypes.func.isRequired,
  onScan: PropTypes.func.isRequired,
};

export default ScanOptions;
