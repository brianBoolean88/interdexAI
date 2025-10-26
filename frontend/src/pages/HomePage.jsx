import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmailPage from "../components/EmailStep";
import QuestionsPage from "../components/QuestionsStep";
import RecipientsPage from "../components/RecipientsStep";
import TraitsPage from "../components/TraitsStep";
import Arrow from "../icons/arrow.svg?react";

export default function HomePage() {
  const [questions, setQuestions] = useState([""]);
  const [traits, setTraits] = useState([""]);
  const [recipients, setRecipients] = useState([""]);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(0);

  // function start(email) {
  //   setEmail(email);
  //   setStep(1);
  // }

  function back() {
    setStep(step - 1);
  }

  function nextStep() {
    setStep(step + 1);
  }

  async function send() {
    // create a session id and navigate to session page with form data
    // use crypto.randomUUID when available, otherwise fallback
    const id = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    navigate(`/session/${id}`, {
      state: {
        email,
        questions,
        traits,
        recipients,
      },
    });
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
      <div className="absolute px-10 h-15 outline flex justify-center items-center w-screen outline-gray-500 bg-pur">
        <h1 className="absolute h-15 flex justify-center items-center top-0 right-10 text-lg font-black">
          interdex.ai
        </h1>
        {step > 0 ? <h1 className="text-lg text-gray-500">{email}</h1> : null}
      </div>
      <div className="h-screen pt-40 flex flex-col items-center relative">
        <div className="pt-1">{page}</div>

        {step > 0 ? (
          <div className="absolute left-20">
            <button
              className="cursor-pointer text-grey-500 text-md focus-gap relative h-10 w-20"
              onClick={back}
            >
              Back
              <div className="absolute top-0 h-10 flex items-center arrow flipped">
                <Arrow className="size-4" />
              </div>
            </button>
          </div>
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
