export default function EmailPage({ email, setEmail }) {
  return (
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
  );
}
