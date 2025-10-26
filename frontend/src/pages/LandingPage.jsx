import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-gray-100">
      <div className="text-center p-8 bg-gray-800 shadow-2xl rounded-xl max-w-lg mx-auto">
        <img 
          src="/interdex-logo.png" 
          alt="Interdex.ai Logo" 
          className="h-24 mx-auto mb-6" 
        />
        <h1 className="text-5xl font-extrabold text-white mb-4">
          interdex.ai
        </h1>
        <h2 className="text-3xl font-semibold text-cyan-400 mb-6"> 
          AI-Powered Interview Automation
        </h2>
        <Link 
          to="/create" 
          className="inline-block px-10 py-4 text-xl font-bold text-white bg-cyan-600 rounded-lg shadow-lg hover:bg-cyan-700 transition duration-300 transform hover:scale-105" 
        >
          Create New Interview
        </Link>
      </div>
    </div>
  );
}
