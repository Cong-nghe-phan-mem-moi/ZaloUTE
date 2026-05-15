export default function AuthCard({ children, title }) {
  return (
    <div
      className="
                bg-white
                shadow-lg
                rounded-xl
                p-8
                w-full
                max-w-md
            "
    >
      <h1
        className="
                    text-2xl
                    font-bold
                    mb-6
                    text-center
                "
      >
        {title}
      </h1>

      {children}
    </div>
  );
}
