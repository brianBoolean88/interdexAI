import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmailPage from "../components/EmailStep";
import QuestionsPage from "../components/QuestionsStep";
import RecipientsPage from "../components/RecipientsStep";
import TraitsPage from "../components/TraitsStep";
import Arrow from "../icons/arrow.svg?react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../components/Firebase";

export default function HomePage() {
  const [questions, setQuestions] = useState([""]);
  const [traits, setTraits] = useState([""]);
  const [recipients, setRecipients] = useState([""]);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(0);

  function back() {
    setStep(step - 1);
  }

  function nextStep() {
    setStep(step + 1);
  }

  async function saveSessionData(id, data) {
    const ref = doc(db, "sessions", id);
    console.log("Saving session data to Firestore with ID:", id);

    await setDoc(ref, {
      ...data,
      createdAt: serverTimestamp(),
    });
    console.log("Session data saved with ID:", id);
    console.log(data);
  }

  async function send() {
    // create a session id and navigate to session page with form data
    // use crypto.randomUUID when available, otherwise fallback
    const id = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    // Initialize Firebase
    await saveSessionData(id, {
      email,
      questions,
      traits,
      recipients,
    })

    navigate(`/created`, {
      state: {
        id,
      }
    })

    /*navigate(`/session/${id}`, {
      state: {
        email,
        questions,
        traits,
        recipients, 
      },
    });*/
  }

  const navigate = useNavigate();

  var page = null;
  switch (step) {
    case 0:
      page = <EmailPage email={email} setEmail={setEmail}></EmailPage>;
      break;
    case 1:
      page = (
        <QuestionsPage
          questions={questions}
          setQuestions={setQuestions}
        ></QuestionsPage>
      );
      break;
    case 2:
      page = <TraitsPage traits={traits} setTraits={setTraits}></TraitsPage>;
      break;
    case 3:
      page = (
        <RecipientsPage
          recipients={recipients}
          setRecipients={setRecipients}
        ></RecipientsPage>
      );
      break;
  }

  return (
    <div>
      <div className="absolute px-10 h-15 outline flex justify-center items-center w-screen outline-gray-500">
        <h1 className="absolute h-15 flex justify-center items-center top-0 right-10 text-lg font-black">
          interdex.ai
        </h1>
        {step > 0 ? <h1 className="text-lg text-gray-500">{email}</h1> : null}
      </div>
      <div className="h-screen py-40 flex flex-col items-center justify-between">
        {step == 0 ? (
          <h1 className="text-6xl mb-10">Create an Interview</h1>
        ) : null}

        {page}

        {step > 0 ? (
          <button
            className="absolute top-40 left-15 flex focus-gap"
            onClick={back}
          >
            <Arrow style={{ transform: "scaleX(-1)" }} />
            Back
          </button>
        ) : null}

        {step < 3 ? (
          <button
            className="px-10 py-5 text-grey-500 text-2xl cursor-pointer flex items-center focus-gap"
            onClick={nextStep}
          >
            Next
            <Arrow />
          </button>
        ) : (
          <button
            className="px-10 py-5 text-white text-2xl cursor-pointer bg-indigo-600 rounded-3xl"
            onClick={async () => {
              await send();
            }}
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
