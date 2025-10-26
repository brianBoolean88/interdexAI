from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)


@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify({"message": "Hello from Flask!"})


@app.route('/api/upload', methods=['POST'])
def upload_audio():
    if 'file' not in request.files:
        return jsonify({'error': 'no file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'no selected file'}), 400
    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    filename = secure_filename(file.filename)
    save_path = os.path.join(uploads_dir, filename)
    file.save(save_path)

    print("recieved upload for question:", request.form.get('questionText'))
    question_text = request.form.get('questionText')
    #the file with the audio is : variable file

    return jsonify({
        'filename': filename,
        'saved_path': save_path,
        'size_bytes': os.path.getsize(save_path),
        'message': 'file saved; implement transcription/LLM integration as needed'
    })

@app.route('/api/finalize', methods=['GET'])
def api_finalize():
    #do some final backend rating here
    return jsonify({
        'final_score': 85,
        'comments': 'Great job overall! A few areas for improvement.'
    })
    

if __name__ == '__main__':
    app.run(debug=True)