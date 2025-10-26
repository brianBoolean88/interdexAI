export default function DynamicList({ list, setList, placeholder }) {
  return (
    <div>
      <ol className="list-decimal ml-5">
        {list.map((item, index) => (
          <li key={index} className="question">
            <input
              type="text"
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
              className=""
            ></input>
          </li>
        ))}
      </ol>
    </div>
  );
}
