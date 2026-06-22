import getImageUrl from "../../utils/imageUrl";

const GroupAvatarUploader = ({ form, onChange, Field }) => {
  const previewUrl = form.avatarPreview || form.avatar;

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    onChange((current) => {
      if (current.avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(current.avatarPreview);
      }

      return {
        ...current,
        avatarFile: file,
        avatarPreview: file ? URL.createObjectURL(file) : "",
      };
    });
  };

  return (
    <Field label="Group avatar">
      <div className="flex flex-wrap items-center gap-4 rounded-md border border-[#dddfe2] bg-white p-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#dbeafe] text-[#1877f2]">
          {previewUrl ? (
            <img
              src={previewUrl.startsWith("blob:") ? previewUrl : getImageUrl(previewUrl)}
              alt="Group avatar preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="material-symbols-outlined text-[30px]">groups</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#e7f3ff] px-4 py-2 text-sm font-semibold text-[#1877f2] hover:bg-[#dbeafe]">
            <span className="material-symbols-outlined text-[18px]">upload</span>
            Choose image
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
          <p className="mt-2 text-xs font-semibold text-[#6b7280]">
            Upload JPG, PNG, GIF, or WEBP.
          </p>
        </div>
      </div>
    </Field>
  );
};

export default GroupAvatarUploader;
