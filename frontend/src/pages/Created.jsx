import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export default function CreatedPage() {
  const location = useLocation();
  const [sessionUrl, setSessionUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Get the session ID from either state or search params
    const sessionId = location.state?.id;
    
    if (sessionId) {
      // Create the full session URL using window.location
      const baseUrl = window.location.origin;
      const sessionUrl = `${baseUrl}/session/${sessionId}`;
      setSessionUrl(sessionUrl);
    }
  }, [location]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sessionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset "Copied!" after 2s
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Interview Created!</h1>
      
      <div style={{ marginTop: 24, color: '#666', fontSize: 13 }} className="mb-6">
        The emails for these AI interview meetings have already been sent to the relevant recipients.
        You can also share the following link with your candidates directly:
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={sessionUrl}
            readOnly
            className="flex-1 p-2 border rounded bg-gray-50"
          />
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="mt-8">
        <a
          href={sessionUrl}
          className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          Go to interview session
          <span className="text-xl">→</span>
        </a>
      </div>
    </div>
  );
}
