from flask import Flask, render_template, jsonify, send_from_directory, request
import os, pandas as pd, requests
from sklearn.cluster import KMeans

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data/<name>')
def data(name):
    return send_from_directory('static/data',f"{name}.geojson")

@app.route("/clusters")
def clusters():
    df = pd.read_csv("static/data/school_locations.csv")
    km = KMeans(n_clusters=3).fit(df[["latitude","longitude"]])
    df["label"] = km.labels_
    features = [{
        "type":"Feature",
        "geometry":{"type":"Point","coordinates":[r.longitude,r.latitude]},
        "properties":{"label":int(r.label)}
    } for r in df.itertuples()]
    return jsonify({"type":"FeatureCollection","features":features})

@app.route("/weather")
def weather():
    lat, lon = request.args["lat"], request.args["lon"]
    key = os.getenv("OWM_KEY")
    r = requests.get("https://api.openweathermap.org/data/3.0/onecall",
                        params=dict(lat=lat,lon=lon,units="metric",appid=key,
                                    exclude="minutely,alerts"),timeout=5)
    return jsonify(r.json())

# @app.route('/supermarkets')
# def supermarkets():
#     return app.send_static_file('supermarket.geojson')

# @app.route('/fuel')
# def fuel():
#     return app.send_static_file('fuel.geojson')

# @app.route('/schools')
# def schools():
#     df = pd.read_csv('static/data/school_locations.csv')
#     return jsonify(df.to_dict(orient='records'))

if __name__ == '__main__':
    app.run(debug=True)