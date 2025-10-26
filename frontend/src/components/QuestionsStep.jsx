import DynamicList from "./DynamicList";

export default function QuestionsPage({ questions, setQuestions }) {
  return (
    <div className="flex flex-col items-center">
      <h3 className="text-2xl">Questions</h3>
      <p className="mt-2 mb-8 text-gray-600">
        Enter each question you would like to ask your applicant.
      </p>

      <DynamicList
        list={questions}
        setList={setQuestions}
        placeholder="Ask away..."
        multiline={true}
      />
    </div>
  );
}
