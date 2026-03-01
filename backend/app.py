from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # biar react boleh akses

@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "message": "Flask backend is running"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)