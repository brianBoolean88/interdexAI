export default function DynamicList({
  list,
  setList,
  placeholder,
  type = "text",
  multiline = false,
}) {
  return (
    <div>
      <ol className="list-decimal ml-5 custom-ol">
        {list.map((item, index) => (
          <li key={index} className="">
            {multiline ? (
              <textarea
                row={5}
                cols={100}
                placeholder={placeholder}
                onChange={(e) => {
                  let newList = [...list];
                  newList[index] = e.target.value;
                  if (newList[newList.length - 1] != "") {
                    newList.push("");
                  }
                  if (e.target.value == "") {
                    newList.pop(-1);
                  }
                  setList(newList);
                }}
                className="p-2 outline-1 outline-dashed outline-gray-400 rounded-lg"
              ></textarea>
            ) : (
              <input
                type={type}
                value={item}
                onChange={(e) => {
                  let newList = [...list];
                  newList[index] = e.target.value;
                  if (newList[newList.length - 1] != "") {
                    newList.push("");
                  }
                  if (e.target.value == "") {
                    newList.pop(-1);
                  }
                  setList(newList);
                }}
                placeholder={placeholder}
                pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                className="p-2 outline-1 outline-gray-400 outline-dashed rounded-lg w-100"
              ></input>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
