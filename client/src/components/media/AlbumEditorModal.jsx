import { useMemo, useState } from "react";

const AlbumEditorModal = ({ mediaItems, onClose, onSubmit, saving }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    privacy: "inherit",
    selectedIds: [],
  });
  const selectedIdSet = useMemo(() => new Set(form.selectedIds), [form.selectedIds]);

  const handleToggle = (id) => {
    setForm((current) => ({
      ...current,
      selectedIds: selectedIdSet.has(id)
        ? current.selectedIds.filter((itemId) => itemId !== id)
        : [...current.selectedIds, id],
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const mediaById = new Map(mediaItems.map((item) => [item.id, item]));

    onSubmit({
      title: form.title,
      description: form.description,
      privacy: form.privacy,
      mediaItems: form.selectedIds
        .map((id) => mediaById.get(id))
        .filter(Boolean)
        .map((item) => ({
          postId: item.postId,
          mediaIndex: item.mediaIndex,
        })),
    });
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/45 px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-5 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Create album</h2>
            <p className="mt-1 text-sm text-[#65676b]">
              Choose posted photos or videos to group together.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f3f5] hover:bg-[#e5e7eb]"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <label className="grid gap-2 text-sm font-semibold">
            Album name
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              className="h-11 rounded-md border border-[#ccd0d5] px-3 outline-none focus:border-[#1877f2]"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Privacy
            <select
              value={form.privacy}
              onChange={(event) =>
                setForm((current) => ({ ...current, privacy: event.target.value }))
              }
              className="h-11 rounded-md border border-[#ccd0d5] bg-white px-3 outline-none focus:border-[#1877f2]"
            >
              <option value="inherit">Follow post privacy</option>
              <option value="public">Public</option>
              <option value="friends">Friends</option>
              <option value="only_me">Only me</option>
            </select>
          </label>
        </div>

        <label className="mt-4 grid gap-2 text-sm font-semibold">
          Description
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            className="min-h-20 resize-none rounded-md border border-[#ccd0d5] px-3 py-2 outline-none focus:border-[#1877f2]"
          />
        </label>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
          {mediaItems.map((item) => {
            const selected = selectedIdSet.has(item.id);

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => handleToggle(item.id)}
                className={`relative aspect-square overflow-hidden rounded-md bg-[#f2f3f5] ring-2 ${
                  selected ? "ring-[#1877f2]" : "ring-transparent"
                }`}
              >
                {item.type === "video" ? (
                  <video src={item.url} className="h-full w-full object-cover" />
                ) : (
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                )}
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#1877f2] shadow">
                  <span className="material-symbols-outlined text-[18px]">
                    {selected ? "check_circle" : "radio_button_unchecked"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#e5e7eb] px-5 py-2 text-sm font-semibold hover:bg-[#d1d5db]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || form.selectedIds.length === 0}
            className="rounded-md bg-[#1877f2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Create album"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AlbumEditorModal;
