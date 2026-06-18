export default function Button({ children, type = "button" }) {
  return (
    <button
      type={type}
      className="
                w-full
                bg-blue-500
                hover:bg-blue-600
                text-white
                py-3
                rounded-lg
                transition
            "
    >
      {children}
    </button>
  );
}
