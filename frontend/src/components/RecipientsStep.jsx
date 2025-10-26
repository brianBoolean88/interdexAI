import DynamicList from "./DynamicList";

export default function QuestionsPage({ recipients, setRecipients }) {
  return (
    <div className="flex flex-col items-center">
      <h3 className="text-2xl ">Recipients</h3>
      <p className="mt-2 mb-8 text-gray-600">
        We will send this virtual interview to each email on this list.
      </p>

      <DynamicList
        list={recipients}
        setList={setRecipients}
        placeholder="john.doe@gmail.com"
      />
    </div>
  );
}
