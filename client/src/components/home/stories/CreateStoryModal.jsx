import { useCreateStoryForm } from "../../../hooks";
import { storyBackgrounds } from "../../../utils/storyUtils";
import AudienceSelector from "../../privacy/AudienceSelector";

const CreateStoryModal = ({ profile, onClose, onCreated }) => {
  const {
    background,
    error,
    handleSubmit,
    media,
    mediaPreview,
    mode,
    privacy,
    selectMediaMode,
    selectTextMode,
    setBackground,
    setMedia,
    setPrivacy,
    setText,
    submitting,
    text,
  } = useCreateStoryForm(onCreated);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <form
        onSubmit={handleSubmit}
        className="grid w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-2xl lg:grid-cols-[280px_minmax(0,1fr)]"
      >
        <aside className="border-b border-[#e5e7eb] p-4 lg:border-b-0 lg:border-r">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-bold">Create Story</h3>
            <button type="button" onClick={onClose} className="text-[#6b7280]">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-2">
            <StoryModeButton
              icon="text_fields"
              label="Text story"
              active={mode === "text"}
              onClick={selectTextMode}
            />
            <StoryModeButton
              icon="perm_media"
              label="Photo or video"
              active={mode === "media"}
              onClick={selectMediaMode}
            />
          </div>

          <AudienceSelector
            friends={profile?.friends || []}
            privacy={privacy}
            onChange={setPrivacy}
            className="mt-5"
          />

          {error ? (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}
        </aside>

        <div className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-[#111827]">Preview</p>
            <button
              type="submit"
              disabled={submitting || (!text.trim() && !media)}
              className="rounded-md bg-[#1877f2] px-5 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Sharing..." : "Share to story"}
            </button>
          </div>

          {mode === "text" ? (
            <>
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={1000}
                className="mb-3 h-28 w-full resize-none rounded-md border border-[#dddfe2] px-3 py-2 text-sm outline-none focus:border-[#1877f2]"
                placeholder="Start typing"
              />
              <div className="mb-4 flex items-center gap-2">
                {storyBackgrounds.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setBackground(color)}
                    className={`h-7 w-7 rounded-full border-2 ${
                      background === color ? "border-[#111827]" : "border-transparent"
                    }`}
                    style={{ background: color }}
                    aria-label={`Use ${color} background`}
                  />
                ))}
              </div>
            </>
          ) : (
            <label className="mb-4 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-[#cbd5e1] px-4 py-5 text-sm font-semibold text-[#4b5563] hover:bg-[#f8fafc]">
              <span className="material-symbols-outlined mr-2 text-[20px]">upload</span>
              Choose photo or video
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(event) => setMedia(event.target.files?.[0] || null)}
              />
            </label>
          )}

          {mode === "media" && media ? (
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={1000}
              className="mb-4 h-20 w-full resize-none rounded-md border border-[#dddfe2] px-3 py-2 text-sm outline-none focus:border-[#1877f2]"
              placeholder="Add a caption"
            />
          ) : null}

          <div className="flex min-h-[460px] items-center justify-center rounded-lg bg-[#18191a] p-5">
            <div
              className="relative flex aspect-[9/16] max-h-[70vh] w-full max-w-[300px] items-center justify-center overflow-hidden rounded-lg text-white shadow-2xl"
              style={{ background: mediaPreview ? "#111827" : background }}
            >
              {mediaPreview ? (
                media?.type?.startsWith("video/") ? (
                  <video className="h-full w-full object-contain" src={mediaPreview} controls />
                ) : (
                  <img className="h-full w-full object-contain" src={mediaPreview} alt="Story preview" />
                )
              ) : (
                <p className="px-5 text-center text-2xl font-bold">
                  {text || "Your text story"}
                </p>
              )}
              {mediaPreview && text ? (
                <p className="absolute bottom-5 left-4 right-4 rounded-md bg-black/50 px-4 py-3 text-center text-base font-bold">
                  {text}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

const StoryModeButton = ({ icon, label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-bold ${
      active ? "bg-[#e7f3ff] text-[#1877f2]" : "bg-[#f2f3f5] text-[#111827]"
    }`}
  >
    <span className="material-symbols-outlined text-[22px]">{icon}</span>
    {label}
  </button>
);

export default CreateStoryModal;
