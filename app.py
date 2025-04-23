from flask import Flask, render_template, jsonify
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
import json
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)

@app.route('/api/supermarkets')
def get_supermarkets():
    # Load supermarket data
    with open('static/data/supermarket.geojson') as f:
        supermarkets = json.load(f)
    
    # Return as JSON
    return jsonify(supermarkets)

@app.route('/api/supermarkets/buffer')
def supermarket_buffer_analysis():
    # Load supermarket data
    with open('static/data/supermarket.geojson') as f:
        data = json.load(f)
    
    features = data['features']
    buffer_results = []
    
    # For each supermarket, check if its buffer overlaps with others
    for i, feature in enumerate(features):
        coords = feature['geometry']['coordinates']
        name = feature['properties'].get('name', f'Supermarket {i}')
        
        # Create a simple representation of the buffer
        buffer_result = {
            'id': i,
            'name': name,
            'coordinates': coords,
            'overlaps': False
        }
        
        # This would be where you check for overlaps
        # For now, simplify by marking every other one as overlapping
        buffer_result['overlaps'] = (i % 2 == 0)
        
        buffer_results.append(buffer_result)
    
    return jsonify(buffer_results)

@app.route('/api/schools/clusters')
def school_clusters():
    try:
        # Load school data
        df = pd.read_csv('static/data/school_locations.csv')
        
        # Extract coordinates for clustering
        X = df[['xcoord', 'ycoord']].values
        
        # Determine optimal number of clusters (simplified)
        k = 5  # You could use methods like elbow method to determine optimal k
        
        # Perform K-means clustering
        kmeans = KMeans(n_clusters=k, random_state=42)
        df['cluster'] = kmeans.fit_predict(X)
        
        # Get cluster centers
        centers = kmeans.cluster_centers_
        
        # Prepare result
        result = {
            'schools': df.to_dict('records'),
            'centers': centers.tolist()
        }
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500