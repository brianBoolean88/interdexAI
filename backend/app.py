import os
from flask import Flask, request, jsonify, render_template, send_file, Response
from flask_cors import CORS
import queue
import threading
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
import google.generativeai as genai
from gtts import gTTS
import json
import io
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email
import time

load_dotenv()
app = Flask(__name__)
CORS(app)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    llm_model = genai.GenerativeModel('gemini-2.5-flash')
except Exception as e:
    print(f"Gemini error: {e}")

verified_invite_sender_email = "interdexai@gmail.com"
verified_report_sender_email = "interdexai@gmail.com"

interviews = {}
results = {}
current_interview_id = 10000000

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

#Employer
@app.route('/')
def employer_page():
    """Serves the main page for employers to create an interview."""
    return render_template('employer.html')

@app.route('/create-interview', methods = ['POST'])
def create_interview():
    """Receives questions, traits, and emails, then sends invite."""
    global current_interview_id
    data = request.json
    
    questions = data.get('questions')
    traits = data.get('traits')
    employer_email = data.get('employer_email')
    applicant_emails = data.get('applicant_emails')

    if not all([questions, traits, employer_email, applicant_emails]):
        return jsonify({"error": "Missing data"}), 400
    if not isinstance(applicant_emails, list):
        return jsonify({"error": "applicant_emails should be a list"}), 400

    interview_id = str(current_interview_id)
    current_interview_id += 1

    interviews[interview_id] = {"questions": questions, "traits": traits, "employer_email": employer_email}
    results[interview_id] = []
    interview_link = f"{request.host_url}interview/{interview_id}"
    report_link = f"{request.host_url}report/{interview_id}"

    sg = SendGridAPIClient(SENDGRID_API_KEY)
    for applicant_email in applicant_emails:
        try:
            message = Mail(
                from_email = verified_invite_sender_email, 
                to_emails = applicant_email,
                subject = "You're Invited to an AI Interview!",
                html_content=f"""
                    <h3>Hello,</h3>
                    <p>You have been invited to complete an automated AI interview.</p>
                    <p>Please click the link below to begin:</p>
                    <a href="{interview_link}" style="padding: 12px 22px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Start Your Interview
                    </a>
                    <p>Good luck!</p>
                """,
            )
            message.reply_to = Email(employer_email)
    
            response = sg.send(message)
            print(f"Email sent, status code: {response.status_code}")
        except Exception as e:
            print(f"Error sending email: {e}")
            pass

    print(f"New interview created, ID: {interview_id}")
    return jsonify({"interview_link": interview_link,"report_link": report_link})

def send_report_email(interview_id):
    interview_data = interviews.get(interview_id)
    report_data = results.get(interview_id)
    recipient_email = interview_data.get("employer_email") if interview_data else None

    if not recipient_email or not report_data:
        print(f"Cannot send report for {interview_id}, missing recipient")
        return
    
    total_rating = 0
    count = 0
    if report_data:
        for res in report_data:
            try: 
                total_rating += int(res['evaluation']['rating'])
                count += 1
            except Exception as e:
                pass
    average = round(total_rating / count if count > 0 else 0, 1)

    html_body = f"<h2>Interview Report -- ID: {interview_id}</h2>"
    html_body += f"<p><strong>Overall Average Rating: {average}/10</strong></p><hr>"
    html_body += "<table border='1' cellpadding='10' cellspacing='0' style='border-collapse: collapse; width: 100%;'>"
    html_body += "<thead><tr><th>Question</th><th>Answer</th><th>Rating</th><th>Feedback</th></tr></thead><tbody>"
    for item in report_data:
        q = item.get("question", "N/A")
        a = item.get("answer", "N/A")
        rating = item.get("evaluation", {}).get("rating", "N/A")
        feedback = item.get("evaluation", {}).get("feedback", "N/A")
        html_body += f"<tr><td>{q}</td><td>{a}</td><td>{rating}/10</td><td>{feedback}</td></tr>"
    html_body += "</tbody></table>"

    try:
        message = Mail(
            from_email = verified_report_sender_email,
            to_emails = recipient_email,
            subject = f"Interview Report - ID: {interview_id}",
            html_content = html_body
        )
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"Report sent to {recipient_email}")
    except Exception as e:
        print(f"Error sending email for {interview_id} to {recipient_email}: {e}")

    """Serves the page for the applicant to take the interview."""
    if interview_id not in interviews:
        return "Interview not found", 404
    return render_template('interview.html', interview_id = interview_id)

@app.route('/get-questions/<interview_id>')
def get_questions(interview_id):
    """Provides the list of questions for the applicant's page."""
    interview_data = interviews.get(interview_id)
    if not interview_data:
        return jsonify({"error": "Interview not found"}), 404
    return jsonify({"questions": interview_data.get("questions", [])})

# Status updates handling
status_updates = {}

def send_status_update(interview_id, status):
    """Send a status update for a specific interview"""
    if interview_id in status_updates:
        status_updates[interview_id].put(status)

@app.route('/api/status/<interview_id>')
def status(interview_id):
    """SSE endpoint for status updates"""
    def generate():
        q = queue.Queue()
        status_updates[interview_id] = q
        try:
            while True:
                # Get status update from queue
                try:
                    status = q.get(timeout=30)  # 30 second timeout
                    yield f"data: {status}\n\n"
                except queue.Empty:
                    yield f"data: ping\n\n"  # Keep connection alive
        finally:
            # Cleanup when client disconnects
            if interview_id in status_updates:
                del status_updates[interview_id]
    
    return Response(generate(), mimetype='text/event-stream')

#AI Part
@app.route('/api/text-to-speech', methods = ['POST'])
def text_to_speech():
    data = request.json
    text_to_speak = data.get('text')
    if not text_to_speak:
        return jsonify({"error": "No text provided"}), 400
    
    try:
        audio_fp = io.BytesIO()
        tts = gTTS(text = text_to_speak, lang = "en")
        tts.write_to_fp(audio_fp)
        audio_fp.seek(0)
        
        print(f"Generated text audio for : {text_to_speak}")
        response = send_file(
            audio_fp, 
            mimetype = "audio/mpeg",
            as_attachment = False,
            download_name = "question.mp3"
        )
        response.headers['Accept-Ranges'] = 'bytes'
        return response
    except Exception as e:
        print(f"Error in gTTS: {e}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/upload', methods = ['POST'])
def upload_audio_and_evaluate():

    file = request.files.get('file')
    if not file:
        return jsonify({"error": "no file part"}), 400
    question = request.form.get('questionText')
    interview_id = request.form.get('interviewId')

    if not all([file, question, interview_id]):
        return jsonify({"error": "Missing file, question text, or interview ID"})
    if file.filename == "":
        return jsonify({"error": "no selected file"})
    
    audio_path = "temp_user_audio.webm"
    file.save(audio_path)
    audio_gemini = None

    try:
        audio_gemini = genai.upload_file(path = audio_path)
        print(f"Uploading file {audio_gemini.name}")
        timeout = 30
        start_time = time.time()

        while audio_gemini.state.name != 'ACTIVE':
            if time.time() - start_time > timeout:
                raise TimeoutError("File processing took too long and timed out")
            time.sleep(1)

            audio_gemini = genai.get_file(name=audio_gemini.name)
            if audio_gemini.state.name == 'FAILED':
                raise APIError("File processing failed on the server.")
        print(f"File is now active ({audio_gemini.state.name}). Proceeding to transcription.")

        prompt = "Transcribe this audio. Only return the text of the transcription"
        response = llm_model.generate_content([prompt, audio_gemini])
        answer = response.text.strip()
        print(f"Transcribed audio to : {answer}")

    except Exception as e:
        print(f"Error in transcription: {e}")
        if audio_gemini:
            genai.delete_file(audio_gemini.name)
        if os.path.exists(audio_path):
            os.remove(audio_path)
        return jsonify({"error": str(e)}), 500
    
    if not answer:
        answer = "No answer spoken"

    print("hi")

    try:
        traits_list = request.form.get("traits", [])
        traits_string = ", ".join(traits_list)
        question_list = request.form.get("questions", [])

        prompt = f"""
        You are a hiring manager looking for these specific traits: {traits_string}.
        
        Evaluate the candidate's answer based *only* on the question and how well it demonstrates those traits.
        
        Provide a rating from 1-10 and a brief justification in the feedback.
        The feedback should *specifically mention* how the answer did or did not reflect the desired traits.

        Return only a valid JSON object in this exact schema:
        {{
            "rating": 8,
            "feedback": "This answer showed good Creativity by..."
        }}

        ---
        Question: "{question}"
        Candidate's answer: "{answer}"
        ---
        """

        print("Sending evaluation request to Gemini...")
        response = llm_model.generate_content(prompt)
        
        if not response.candidates or not response.candidates[0].content:
            raise ValueError("No valid response from evaluation model")

        print(response)
            
        json_text = response.candidates[0].content.parts[0].text.replace("```json", "").replace("```", "").strip()
        print(json_text)
        try:
            evaluation_json = json.loads(json_text)
            print(evaluation_json)
            if not isinstance(evaluation_json, dict) or 'rating' not in evaluation_json or 'feedback' not in evaluation_json:
                raise ValueError("Invalid evaluation format")
        except json.JSONDecodeError as e:
            print("can't parse")
            raise ValueError(f"Failed to parse evaluation response: {e}")
        print("hi")
        results[interview_id] = {"question": question, "answer": answer, "evaluation": evaluation_json}
        
        print("hi")
        print(f"Evaluated Rating: {evaluation_json.get('rating')}/10")

        is_last_question = False
        try:
            print("hi")
            current_question_index = question_list.index(question)
            if current_question_index == len(question_list) - 1:
                is_last_question = True
        except ValueError:
            print("hi")
            if len(results.get(interview_id, [])) == len(question_list):
                is_last_question = True
                print(f"Triggering report for {interview_id}: all questions answered.")
        
        print("hi")
        if is_last_question:
            print("hi")
            send_report_email(interview_id)
        return jsonify(evaluation_json)
    
    except Exception as e:
        print(f"Error in evaluation: {e}")
        return jsonify({"error": "Error evaluating answer"}), 500
    
#Report
@app.route('/report/<interview_id>')
def report_page(interview_id):
    if interview_id not in results:
        return "Report not found", 404
    return render_template('report.html', interview_id = interview_id)

@app.route('/get-report-data/<interview_id>', methods = ['GET'])
def get_report_data(interview_id):
    if interview_id not in results:
        return jsonify({"error": "Report not found"}), 404
    
    all_results = results[interview_id]
    total_rating = 0
    count = 0
    if all_results:
        for res in all_results:
            try:
                total_rating += int(res['evaluation']['rating'])
                count += 1
            except Exception:
                pass
    average = total_rating / count if count > 0 else 0
    return jsonify({"results": all_results, "average_rating": round(average, 1)})

#Main
if __name__ == "__main__":
    app.run(debug = True, port = 5000)
