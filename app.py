from flask import Flask, render_template

# Initialize the Flask application
app = Flask(__name__)

# Define the main route and render the index page
@app.route('/')
def index():
    return render_template('index.html')

# Run the application (development mode)
if __name__ == '__main__':
    app.run(debug=True)