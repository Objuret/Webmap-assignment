from flask import Flask, render_template, jsonify
import pandas as pd
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/supermarkets')
def supermarkets():
    return app.send_static_file('supermarket.geojson')

@app.route('/fuel')
def fuel():
    return app.send_static_file('fuel.geojson')

@app.route('/schools')
def schools():
    df = pd.read_csv('static/school_locations.csv')
    return jsonify(df.to_dict(orient='records'))

if __name__ == '__main__':
    app.run(debug=True)