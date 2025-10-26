import { useParams } from "react-router-dom";

export default function SessionPage() {
  const { id } = useParams();

  return <h1>Session ID: {id}</h1>;
}
