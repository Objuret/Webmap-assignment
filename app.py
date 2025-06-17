# from flask import Flask, render_template, jsonify #, request
# import pandas as pd
# # import numpy as np # Not used directly in this version of app.py
# from sklearn.cluster import KMeans
# import json
# # import os # Not used

# app = Flask(__name__)

# @app.route('/')
# def index():
#     return render_template('index.html')

# # This endpoint is useful if you want the backend to serve the GeoJSON
# @app.route('/api/supermarkets')
# def get_supermarkets():
#     try:
#         with open('static/data/supermarket.geojson', 'r', encoding='utf-8') as f: # Added encoding
#             supermarkets_data = json.load(f)
#         return jsonify(supermarkets_data)
#     except FileNotFoundError:
#         return jsonify({"error": "Supermarket data file not found."}), 404
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


# @app.route('/api/schools/clusters')
# def school_clusters():
#     try:
#         # Ensure school_locations.csv is in static/data/
#         df = pd.read_csv('static/data/school_locations.csv')

#         # Check for required columns
#         if 'xcoord' not in df.columns or 'ycoord' not in df.columns:
#             return jsonify({'error': 'CSV must contain "xcoord" and "ycoord" columns.'}), 400
        
#         # Drop rows with NaN in coordinates as KMeans cannot handle them
#         df.dropna(subset=['xcoord', 'ycoord'], inplace=True)
#         if df.empty:
#             return jsonify({'error': 'No valid coordinate data found after dropping NaN values.'}), 400

#         X = df[['xcoord', 'ycoord']].values
        
#         # Simplified: Use a fixed k or a simple heuristic if dataset is small
#         # For larger datasets, an elbow method or silhouette score would be better.
#         k = min(5, len(df)) # Ensure k is not more than number of samples
#         if k < 1: # Handle case where df might become empty or too small
#              return jsonify({'error': 'Not enough data points for clustering.'}), 400


#         kmeans = KMeans(n_clusters=k, random_state=42, n_init=10) # Added n_init
#         df['cluster'] = kmeans.fit_predict(X)
        
#         centers = kmeans.cluster_centers_
        
#         result = {
#             'schools': df.to_dict('records'),
#             'centers': centers.tolist()
#         }
#         return jsonify(result)
#     except FileNotFoundError:
#         return jsonify({'error': 'school_locations.csv not found.'}), 404
#     except Exception as e:
#         app.logger.error(f"Error in /api/schools/clusters: {e}") # Log the error
#         return jsonify({'error': str(e)}), 500

# if __name__ == '__main__':
#     app.run(debug=True)

# Webmap-assignment/app.py

from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)