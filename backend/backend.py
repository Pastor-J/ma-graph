from flask import Flask, request, jsonify
from flask_cors import CORS
from analysis import simple_analysis

app = Flask(__name__)
CORS(app)

@app.route('/api/analyze', methods=['POST'])
def analyze_flow():
    # Get graph data
    flow_data = request.get_json()

    # Analyze the flow data
    simple_analysis(flow_data)

    # Store flow data into dictionary
    result = {"message": "Analysis complete", "data": flow_data}

    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
