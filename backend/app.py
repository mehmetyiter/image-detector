from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from utils.detector import compare_all_images
import os
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

@app.route('/scan', methods=['POST'])
def scan_images():
    data = request.json
    folder_path = data.get('folder_path')
    print("Received folder path (from frontend):", folder_path)  # Log incoming folder path

    threshold = float(data.get('threshold', 0.5))
    
    # Try different path combinations to find the folder
    possible_paths = [
        folder_path,                                              # Original path
        os.path.join(os.getcwd(), folder_path),                   # Relative to backend
        os.path.join(os.path.dirname(os.getcwd()), folder_path),  # Relative to project root
        os.path.join('/home/mehmet/Desktop', folder_path)         # Relative to user desktop
    ]
    
    full_path = None
    for path in possible_paths:
        print(f"Trying path: {path}")
        if os.path.isdir(path):
            full_path = path
            print(f"Found valid directory: {full_path}")
            break
    
    if not full_path:
        return jsonify({"error": f"Could not find folder '{folder_path}'. Tried paths: {possible_paths}"}), 400

    # Check if the directory is empty
    if not os.listdir(full_path):
        return jsonify({"error": f"Folder '{full_path}' is empty"}), 400

    # Perform image comparison
    results = compare_all_images(full_path, threshold)
    
    # Format results as JSON - adjusted to match frontend expectations
    response = [
        {"path": pair[0], "comparedWith": pair[1], "similarity": pair[2]}
        for pair in results
    ]
    return jsonify(response)

@app.route('/delete', methods=['POST'])
def delete_images():
    data = request.json
    image_paths = data.get('image_paths', [])
    
    if not image_paths:
        return jsonify({"error": "No images specified for deletion"}), 400
    
    success_count = 0
    failed_paths = []
    
    for path in image_paths:
        try:
            # Try possible combinations of paths
            possible_paths = [
                path,
                os.path.join(os.getcwd(), path),
                os.path.join(os.path.dirname(os.getcwd()), path),
                os.path.join('/home/mehmet/Desktop', path)
            ]
            
            deleted = False
            for p in possible_paths:
                if os.path.exists(p) and os.path.isfile(p):
                    os.remove(p)
                    success_count += 1
                    deleted = True
                    print(f"Successfully deleted: {p}")
                    break
            
            if not deleted:
                print(f"Could not find file to delete: {path}")
                print(f"Tried paths: {possible_paths}")
                failed_paths.append(path)
        except Exception as e:
            print(f"Error deleting {path}: {e}")
            failed_paths.append(path)
    
    return jsonify({
        "deleted": success_count,
        "failed": len(failed_paths),
        "failed_paths": failed_paths
    })

@app.route('/image', methods=['GET'])
def serve_image():
    image_path = request.args.get('path')
    if not image_path:
        return "No image path provided", 400
    
    # Try different path combinations
    possible_paths = [
        image_path,
        os.path.join(os.getcwd(), image_path),
        os.path.join(os.path.dirname(os.getcwd()), image_path),
        os.path.join('/home/mehmet/Desktop', image_path)
    ]
    
    for path in possible_paths:
        if os.path.exists(path) and os.path.isfile(path):
            try:
                return send_file(path)
            except Exception as e:
                print(f"Error serving image {path}: {e}")
                continue
    
    # Return a default image if path not found
    return "Image not found", 404

if __name__ == "__main__":
    app.run(debug=True, port=5002)
