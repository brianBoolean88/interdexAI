export default function EmailPage({
  email,
  setEmail,
  error,
  setError,
  setCanContinue,
}) {
  return (
    <div>
      <h1 className="text-6xl mt-15 mb-20">Create an Interview</h1>
      <div className="flex flex-col gap-2 items-center">
        <div className="text-lg">Your Email</div>
        <input
          type="email"
          placeholder="john.doe@gmail.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setCanContinue(e.target.checkValidity());
            if (e.target.checkValidity()) {
              setError(false);
            }
          }}
          pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
          className={`outline-dashed p-1 rounded-sm text-center w-100 email ${error ? "outline-red-600" : "outline-gray-500"}`}
        ></input>
      </div>
    </div>
  );
}
