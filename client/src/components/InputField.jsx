export default function InputField({
  label,
  type,
  name,
  placeholder,
  value,
  onChange,
}) {
  return (
    <div className="mb-4">
      <label className="block mb-2 font-medium">{label}</label>

      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="
                    w-full
                    border
                    border-gray-300
                    rounded-lg
                    p-3
                    outline-none
                    focus:border-blue-500
                "
      />
    </div>
  );
}
