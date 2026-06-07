import { useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { createPost } from "../../store/slices/postSlice";
import HomeAvatar from "./HomeAvatar";

const Composer = ({ profile }) => {
  const dispatch = useAppDispatch();
  const { loading, error, message } = useAppSelector((state) => state.posts);
  const fileInputRef = useRef(null);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);

  const canSubmit = content.trim().length > 0 || files.length > 0;

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files || []));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit || loading) {
      return;
    }

    const formData = new FormData();
    formData.append("content", content.trim() || "Shared media");
    files.forEach((file) => formData.append("media", file));

    try {
      await dispatch(createPost(formData)).unwrap();
      setContent("");
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      // Error state is rendered from Redux.
    }
  };

  return (
    <section className="rounded bg-white p-7 shadow-sm">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-3">
          <HomeAvatar image={profile?.avatar} name={profile?.fullName} />
          <div>
            <p className="text-sm font-bold">
              {profile?.fullName || "Hexa Betania"}
            </p>
            <p className="flex items-center gap-1 text-xs text-[#6b7280]">
              <span className="material-symbols-outlined text-[14px]">
                public
              </span>
              Public
            </p>
          </div>
        </div>

        <textarea
          className="mt-7 min-h-20 w-full resize-none border-0 border-b border-[#d1d5db] bg-transparent pb-7 text-xl text-[#111827] outline-none placeholder:text-[#b0b4ba]"
          maxLength={5000}
          placeholder={`What's on your mind, ${
            profile?.fullName?.split(" ")?.slice(-1)?.[0] || "Hexania"
          } ?`}
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />

        {files.length > 0 ? (
          <div className="mt-3 rounded-md bg-[#f2f3f5] px-3 py-2 text-sm text-[#4b5563]">
            {files.length} file selected
          </div>
        ) : null}

        {error ? (
          <div className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mt-4 grid grid-cols-4 items-center gap-2 text-sm font-semibold text-[#4b5563]">
          <ComposerAction
            icon="videocam"
            label="Live Video"
            color="text-rose-500"
            type="button"
          />
          <ComposerAction
            icon="photo_library"
            label="Photo / video"
            color="text-emerald-500"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          />
          <ComposerAction
            icon="mood"
            label="Feeling / Activity"
            color="text-yellow-500"
            type="button"
          />
          <div className="flex justify-end">
            {canSubmit ? (
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-[#1877f2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Posting..." : "Post"}
              </button>
            ) : (
              <span className="material-symbols-outlined text-[#6b7280]">
                more_horiz
              </span>
            )}
          </div>
        </div>
      </form>
    </section>
  );
};

const ComposerAction = ({ icon, label, color, type = "button", onClick }) => (
  <button
    type={type}
    onClick={onClick}
    className="flex items-center justify-center gap-2 rounded-md py-2 hover:bg-[#f2f3f5]"
  >
    <span className={`material-symbols-outlined text-[20px] ${color}`}>
      {icon}
    </span>
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export default Composer;
