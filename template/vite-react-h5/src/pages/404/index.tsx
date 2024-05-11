import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center items-center w-full h-full">
      <div>
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-xl">Page not found</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => navigate(-1)}
        >
          Go back
        </button>
      </div>
    </div>
  );
};

export default NotFound;
