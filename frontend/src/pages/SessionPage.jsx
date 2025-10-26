import { useParams } from "react-router-dom";

export default function SessionPage() {
  const { id } = useParams();

  return <h1>Results ID: {id}</h1>;
}
