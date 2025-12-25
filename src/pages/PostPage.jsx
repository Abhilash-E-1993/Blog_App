import { useParams } from "react-router-dom";

function PostPage() {
  const { slug } = useParams();

  return (
    <div className="text-white">
      <h1 className="text-2xl font-bold mb-4">Single Post Page</h1>
      <p>Slug: {slug}</p>
    </div>
  );
}

export default PostPage;
