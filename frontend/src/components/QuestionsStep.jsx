import DynamicList from "./DynamicList";

export default function QuestionsPage({ questions, setQuestions }) {
  return (
    <div className="m-10">
      <h3 className="text-2xl mb-5">Enter Your Questions</h3>

      <DynamicList
        list={questions}
        setList={setQuestions}
        placeholder="Enter a question..."
      />
    </div>
  );
}
