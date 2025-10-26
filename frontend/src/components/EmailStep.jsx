export default function EmailPage({ email, setEmail }) {
  return (
    <div>
      <h1 className="text-6xl mt-20 mb-10">Create an Interview</h1>
      <div className="flex flex-col gap-2 items-center">
        <div className="text-lg">Your Email</div>
        <input
          type="text"
          placeholder="john.doe@gmail.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
          }}
          className="outline p-1 rounded-sm text-center"
        ></input>
      </div>
    </div>
  );
}
