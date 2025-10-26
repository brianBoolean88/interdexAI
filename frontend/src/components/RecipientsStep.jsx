import DynamicList from "./DynamicList";

export default function QuestionsPage({ recipients, setRecipients }) {
  return (
    <div className="m-10">
      <h3 className="text-2xl mb-5">Recipients</h3>

      <DynamicList
        list={recipients}
        setList={setRecipients}
        placeholder="john.doe@gmail.com"
      />
    </div>
  );
}
