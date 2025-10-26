import { useParams, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

export default function SessionPage() {
  const { id } = useParams();
  const location = useLocation();
  const { state } = location || {};

  const email = state?.email ?? null;
  const questions = state?.questions ?? null;
  const traits = state?.traits ?? null;
  const recipients = state?.recipients ?? null;

  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [startedInterview, setStartedInterview] = useState(null);
  const [error, setError] = useState(null);
  const [uploadResponse, setUploadResponse] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finishedAll, setFinishedAll] = useState(false);
  const [finalRating, setFinalRating] = useState(null);
  const [finalComments, setFinalComments] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    fetch("/api/data")
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
      .catch((err) => setError(String(err)));
    //auto start recording when interview starts or when we advance to a new question
    if (startedInterview && !finishedAll && !recording) {
      (async () => {
        try {
          await startRecording();
        } catch (err) {}
      })();
    }
  }, [startedInterview, currentIndex, finishedAll]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const options = { mimeType: "audio/webm" };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.addEventListener("dataavailable", (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      });

      mediaRecorder.addEventListener("stop", async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
        try {
          await handleUploadBlob(blob);
        } catch (err) {}
      });

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      setError("Microphone access denied or not available: " + String(err));
    }
  };

  const stopRecording = () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    setRecording(false);
  };

  const downloadRecording = () => {
    if (!audioUrl) return;
    fetch(audioUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const a = document.createElement("a");
        const url = URL.createObjectURL(blob);
        a.href = url;
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        a.download = `recording-${ts}.webm`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })
      .catch((err) => setError("Failed to download recording: " + String(err)));
  };

  const handleUploadBlob = async (blob) => {
    setError(null);

    try {
      const form = new FormData();
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `recording-${ts}.webm`;
      form.append("file", blob, filename);
      form.append("sessionId", id || "unknown");
      form.append("questionIndex", String(currentIndex));
      form.append("questionText", (questions && questions[currentIndex]) || "");

      setError("Uploading...");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Upload failed: ${res.status} ${text}`);
      }
      const data = await res.json();
      setError(null);
      setUploadResponse(JSON.stringify(data));

      const lastIndex = questions.length - 2; //account for empty element
      if (currentIndex < lastIndex) {
        setCurrentIndex((i) => i + 1);
        //reset audio for next question
        setAudioUrl(null);
        setUploadResponse(null);
      } else {
        //finished all questions
        setFinishedAll(true);
        //attempt to fetch final rating from backend
        try {
          const fin = await fetch("/api/finalize", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          if (fin.ok) {
            const finData = await fin.json();
            setFinalRating(finData.final_score ?? null);
            setFinalComments(finData.comments ?? null);
            console.log("LLM final rating:", finData.final_score ?? null);
          } else {
            const txt = await fin.text();
            console.log("Finalize request failed:", fin.status, txt);
          }
        } catch (err) {
          console.log("Finalize error:", err);
        }
      }
    } catch (err) {
      setError("Upload error: " + String(err));
      throw err;
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">INTERVIEW SESSION {id}</h1>

      <div style={{ marginTop: 24, color: "#666", fontSize: 13 }}>
        Please turn up your volume. This is a take-home interview assessment.
        You will be asked questions and evaluated based on your performance.
      </div>

      <div className="">
        {uploadResponse && (
          <div style={{ marginTop: 12 }}>
            <strong>Upload response:</strong>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                background: "#f4f4f4",
                padding: 8,
              }}
            >
              {uploadResponse}
            </pre>
          </div>
        )}
      </div>

      <div padding={10} className="flex justify-center mt-10 mb-10">
        {!startedInterview && !finishedAll && (
          <button
            className="px-10 py-5 text-white text-2xl cursor-pointer bg-indigo-600 rounded-3xl"
            onClick={() => {
              setStartedInterview(true);
            }}
          >
            START
          </button>
        )}

        {startedInterview && !finishedAll && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold">
              Question {currentIndex + 1}
            </h2>
            <p className="mt-2 mb-4">
              {(questions && questions[currentIndex]) ||
                "No question text provided."}
            </p>

            <div style={{ marginTop: 12 }}>
              {!recording && (
                <button
                  onClick={startRecording}
                  className="px-4 py-2 bg-green-500 text-white rounded"
                >
                  Start
                </button>
              )}
              {recording && (
                <button
                  onClick={stopRecording}
                  className="px-4 py-2 bg-red-500 text-white rounded"
                >
                  End
                </button>
              )}

              {audioUrl && (
                <>
                  <div style={{ marginTop: 12 }}>
                    <audio controls src={audioUrl} />
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button onClick={downloadRecording}>
                      Download recording
                    </button>
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
            {finalRating !== null && (
              <p className="mt-2">Final rating: {String(finalRating)}</p>
            )}
            {finalComments !== null && (
              <p className="mt-2">Comments: {String(finalComments)}</p>
            )}
          </div>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 12, color: "crimson" }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}
