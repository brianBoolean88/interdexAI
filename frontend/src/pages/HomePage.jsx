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

  const [canContinue, setCanContinue] = useState(false);
  const [error, setError] = useState(false);

  function back() {
    setStep(step - 1);
  }

  function nextStep() {
    if (!canContinue) {
      setError(true);
      return;
    }
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

    // Save session data to Firestore
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
  }

  const navigate = useNavigate();

  var page = null;
  switch (step) {
    case 0:
      page = (
        <EmailPage
          email={email}
          setEmail={setEmail}
          error={error}
          setError={setError}
          setCanContinue={setCanContinue}
        ></EmailPage>
      );
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

        <div className={step > 0 ? "absolute bottom-15" : "mt-15"}>
          {step < 3 ? (
            <button
              className="cursor-pointer text-grey-500 text-2xl focus-gap relative h-10 w-30 mb-5"
              onClick={nextStep}
            >
              Next
              <div className="absolute top-0 h-10 flex items-center arrow right">
                <Arrow className="size-5" />
              </div>
            </button>
          ) : (
            <button
              className="cursor-pointer px-10 py-5 text-white text-2xl bg-gray-900 rounded-3xl"
              onClick={async () => {
                await send();
              }}
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
