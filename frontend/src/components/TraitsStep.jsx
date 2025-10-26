import DynamicList from "./DynamicList";

export default function TraitsPage({ traits, setTraits }) {
  return (
    <div className="m-10">
      <h3 className="text-2xl mb-5">What traits are you looking for?</h3>

      <DynamicList
        list={traits}
        setList={setTraits}
        placeholder="Enter a trait..."
      />
    </div>
  );
}
