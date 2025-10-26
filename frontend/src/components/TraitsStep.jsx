import DynamicList from "./DynamicList";

export default function TraitsPage({ traits, setTraits }) {
  return (
    <div className="flex flex-col items-center w-100">
      <h3 className="text-2xl ">Traits</h3>
      <p className="mt-2 mb-8 text-gray-600">
        What traits are you looking for in your applicants?
      </p>

      <DynamicList
        list={traits}
        setList={setTraits}
        placeholder="Enter a trait..."
      />
    </div>
  );
}
