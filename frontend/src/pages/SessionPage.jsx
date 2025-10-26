import { useParams, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../components/Firebase";

export default function SessionPage() {
  const { id } = useParams();
  const location = useLocation();
  const { state } = location || {};

  const [sessionData, setSessionData] = useState({
    email: null,
    questions: null,
    traits: null,
    recipients: null
  });

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    async function loadSession() {
      try {
        const ref = doc(db, "sessions", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setSessionData({
            email: data.email,
            questions: data.questions,
            traits: data.traits,
            recipients: data.recipients
          });
        } else {
          setLoadError("Session not found");
        }
      } catch (error) {
        console.error("Error loading session:", error);
        setLoadError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, [id]);

  // Destructure session data for easier access
  const { email, questions, traits, recipients } = sessionData;

  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [startedInterview, setStartedInterview] = useState(null);
  const [error, setError] = useState(null);
  const [uploadResponse, setUploadResponse] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finishedAll, setFinishedAll] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [finalRating, setFinalRating] = useState(null);
  const [finalComments, setFinalComments] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    //auto start recording when interview starts or when we advance to a new question
    if (startedInterview && !finishedAll && !recording) {
      (async () => {
        try {
          //post request here for text to speech
          const text = (questions && questions[currentIndex]) || '';
          setError('Loading text-to-speech...');
          try {
            const res = await fetch('/api/text-to-speech', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ text })
            });

            if (!res.ok) {
              console.error("Text-to-speech request failed:", await res.text());
              throw new Error("Failed to get audio");
            }

            const audioBlob = await res.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            const audio = new Audio(audioUrl);
            audio.onended = async () => {
              URL.revokeObjectURL(audioUrl);
              await startRecording();
            };

            setError('Playing question...');
            await audio.play();
          } catch (err) {
            console.error("Error playing text-to-speech:", err);
            setError('Failed to play question audio. Starting recording...');
            await startRecording();
          }
        } catch (err) {
        }
      })();
    }
  }, [startedInterview, currentIndex, finishedAll]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.addEventListener('dataavailable', (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      });

      mediaRecorder.addEventListener('stop', async () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
        try {
          // pass the blob to the upload handler so it can be sent with a filePath
          await handleUploadBlob(blob);
        } catch (err) {
          console.error('Upload error:', err);
        }
      });

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      setError('Microphone access denied or not available: ' + String(err));
    }
  };

  const stopRecording = () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setRecording(false);
  };

  const downloadRecording = () => {
    if (!audioUrl) return;
    fetch(audioUrl)
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement('a');
        const url = URL.createObjectURL(blob);
        a.href = url;
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `recording-${ts}.webm`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })
      .catch(err => setError('Failed to download recording: ' + String(err)));
  };

  // accept the recorded blob and send it plus a suggested filePath to the backend
  const handleUploadBlob = async (blob) => {
    setError(null);

    try {
      const form = new FormData();
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = `uploads/recording-${ts}.webm`;
      form.append('filePath', filePath);
      const filename = `recording-${ts}.webm`;
      form.append('file', blob, filename);
      form.append('interviewId', id || 'unknown');
      form.append('traits', traits);
      form.append('questions', questions);
      form.append('questionText', (questions && questions[currentIndex]) || '');

      setError('Preparing to upload audio file...');
      setProcessingStatus(null);

      // Start listening for status updates
      const eventSource = new EventSource(`/api/status/${id}`);
      eventSource.onmessage = (event) => {
        if (event.data === 'ping') return;
        const status = JSON.parse(event.data);
        setProcessingStatus(status);
      };

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      });
      
      if (!res.ok) {
        eventSource.close();
        const text = await res.text();
        throw new Error(`Upload failed: ${res.status} ${text}`);
      }

      try {
        const data = await res.json();
        eventSource.close(); // Close the event source when we're done
        setError(null);
        setProcessingStatus(null);
        setUploadResponse(JSON.stringify(data));
      } catch (e) {
        eventSource.close(); // Make sure to close the event source on error
        throw e;
      }

      const lastIndex = questions.length - 2; //account for empty element
      if (currentIndex < lastIndex) {
        setCurrentIndex((i) => i + 1);
        //reset audio for next question
        setAudioUrl(null);
        setUploadResponse(null);
      } else {
        //finished all questions
        setFinishedAll(true);
      }
    } catch (err) {
      setError('Upload error: ' + String(err));
      throw err;
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">INTERVIEW SESSION {id}</h1>

      {isLoading ? (
        <div className="text-center py-4">Loading session data...</div>
      ) : loadError ? (
        <div className="text-red-600 py-4">{loadError}</div>
      ) : (
        <div style={{ marginTop: 24, color: '#666', fontSize: 13 }}>
          Please turn up your volume. This is a take-home interview assessment. You will be asked questions and evaluated based on your performance.
        </div>
      )}

      <div className="mt-8">
        {uploadResponse && (
          <div className="p-6 rounded-lg bg-white shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">AI Evaluation</h3>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Rating:</span>
                <span className={`text-lg font-bold px-3 py-1 rounded ${
                  JSON.parse(uploadResponse).rating >= 7 ? 'bg-green-100 text-green-700' :
                  JSON.parse(uploadResponse).rating >= 4 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {JSON.parse(uploadResponse).rating}/10
                </span>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Feedback:</h4>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                {JSON.parse(uploadResponse).feedback.replaceAll("*", "")}
              </p>
            </div>
          </div>
        )}
      </div>

      {!startedInterview && !finishedAll && (

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <button
            className="px-10 py-5 text-white text-2xl cursor-pointer bg-indigo-600 rounded-3xl"
            onClick={() => {
              setStartedInterview(true)
            }}
          >
            START
          </button>
        </div>
      )}




      {!error && startedInterview && !finishedAll && (
        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold">Question {currentIndex + 1}</h2>
          <p className="mt-2 mb-4">{(questions && questions[currentIndex]) || 'No question text provided.'}</p>

          <div style={{ marginTop: 12 }}>
            {!recording && (
              <button onClick={startRecording} className="px-4 py-2 bg-green-500 text-white rounded">Start</button>
            )}
            {recording && (
              <button onClick={stopRecording} className="px-4 py-2 bg-red-500 text-white rounded">End</button>
            )}

            {audioUrl && (
              <>
                <div style={{ marginTop: 12 }}>
                  <audio controls src={audioUrl} />
                </div>
                <div style={{ marginTop: 8 }}>
                  <button onClick={downloadRecording}>Download recording</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {finishedAll && (
        <div className="text-center">
          <h2 className="text-2xl font-bold">Thank you!</h2>
          <p className="mt-2">Your interview has been submitted.</p>
          {finalRating !== null && <p className="mt-2">Final rating: {String(finalRating)}</p>}
          {finalComments !== null && <p className="mt-2">Comments: {String(finalComments)}</p>}
        </div>
      )}


      {(error || processingStatus) && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center mb-2">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-semibold text-blue-700">Processing...</span>
          </div>
          
          {processingStatus && (
            <div className="mt-4">
              <div className="w-full bg-blue-100 rounded-full h-2.5 mb-2">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${(processingStatus.step / processingStatus.total_steps) * 100}%` }}
                ></div>
              </div>
              <p className="text-blue-700 font-medium">{processingStatus.status}</p>
            </div>
          )}

          {error && (
            <div className="text-blue-600 ml-8 space-y-1 mt-2">
              {error.split('\n').map((line, i) => (
                <p key={i} className="flex items-center">
                  <span className="mr-2">•</span>
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
