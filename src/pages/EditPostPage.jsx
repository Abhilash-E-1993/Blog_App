import { useParams } from "react-router-dom";

function EditPostPage() {
  const { id } = useParams();

  return (
    <div className="text-white">
      <h1 className="text-2xl font-bold mb-4">Edit Post Page</h1>
      <p>Editing post with ID: {id}</p>
    </div>
  );
}

export default EditPostPage;
