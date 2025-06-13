import os
import cv2
from collections import defaultdict


def orb_similarity(image1_path, image2_path):
    """
    Calculate similarity between two images using ORB (Oriented FAST and Rotated BRIEF).
    """
    # Load images in grayscale
    img1 = cv2.imread(image1_path, cv2.IMREAD_GRAYSCALE)
    img2 = cv2.imread(image2_path, cv2.IMREAD_GRAYSCALE)

    # Initialize ORB detector
    orb = cv2.ORB_create()

    # Detect keypoints and compute descriptors
    keypoints1, descriptors1 = orb.detectAndCompute(img1, None)
    keypoints2, descriptors2 = orb.detectAndCompute(img2, None)

    # If descriptors are empty, consider similarity as 0
    if descriptors1 is None or descriptors2 is None:
        return 0

    # Use Brute-Force Matcher to compare descriptors
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = bf.match(descriptors1, descriptors2)

    # Calculate similarity ratio
    similar_regions = [m for m in matches if m.distance < 50]
    similarity = len(similar_regions) / len(matches) if matches else 0

    return similarity


def find_image_groups(folder_path, threshold=0.5, max_group_size=5):
    """
    Find groups of similar images using Union-Find algorithm.
    Split large groups to have multiple originals.
    """
    if not os.path.exists(folder_path):
        return {}

    # Check if folder is empty
    if not os.listdir(folder_path):
        return {}
    
    files = [        
        os.path.join(folder_path, file)
        for file in os.listdir(folder_path)
        if file.endswith(('.jpg', '.png', '.jpeg'))
    ]
    
    # Sort files by name to process sequential images together
    files.sort()
    
    # Union-Find parent dictionary
    parent = {f: f for f in files}
    
    def find(x):
        if parent[x] != x:
            parent[x] = find(parent[x])
        return parent[x]
    
    def union(x, y):
        px, py = find(x), find(y)
        if px != py:
            parent[px] = py
    
    # Compare all images and union similar ones
    for i in range(len(files)):
        for j in range(i + 1, len(files)):
            image1_path = files[i]
            image2_path = files[j]

            # Calculate ORB similarity score
            score = orb_similarity(image1_path, image2_path)
            print(f"Comparing: {image1_path} vs {image2_path} - ORB Score: {score:.2f}")

            # Union if similarity exceeds threshold
            if score >= threshold:
                union(image1_path, image2_path)
    
    # Group images by their root parent
    groups = defaultdict(list)
    for file in files:
        root = find(file)
        groups[root].append(file)
    
    # Process groups and split large ones
    result = {}
    for original, group_files in groups.items():
        if len(group_files) > 1:
            # Sort group files to ensure consistent ordering
            group_files.sort()
            
            # If group is too large, split it into subgroups
            if len(group_files) > max_group_size:
                # Create multiple subgroups
                for i in range(0, len(group_files), max_group_size):
                    subgroup = group_files[i:i + max_group_size]
                    if len(subgroup) > 1:
                        # First file in each subgroup is the original
                        result[subgroup[0]] = subgroup[1:]
            else:
                # Small group - first file is the original
                result[group_files[0]] = group_files[1:]
    
    return result


def compare_all_images(folder_path, threshold=0.5):
    """
    Compare all images in a given folder using ORB and return similar pairs.
    Now uses grouping to ensure similar images are properly organized.
    Large groups are split to have multiple originals.
    """
    groups = find_image_groups(folder_path, threshold)
    
    similar_pairs = []
    
    # Convert groups to pair format expected by frontend
    for original, duplicates in groups.items():
        for duplicate in duplicates:
            # Get similarity score for this specific pair
            score = orb_similarity(original, duplicate)
            similar_pairs.append((original, duplicate, score))
    
    return similar_pairs