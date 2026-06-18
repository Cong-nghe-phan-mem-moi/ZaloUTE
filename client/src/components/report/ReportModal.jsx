import { useState } from "react";
import { reportAPI } from "../../services/report.service";

const reasons = [
  { value: "spam", label: "Spam" },
  { value: "bad_content", label: "Bad content" },
  { value: "fake", label: "Fake identity" },
  { value: "harassment", label: "Harassment" },
];

const ReportModal = ({ target, onClose, onSubmitted }) => {
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!target) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError("");

    try {
      await reportAPI.createReport({
        targetType: target.type,
        targetId: target.id,
        reason,
        details,
      });
      onSubmitted?.();
      onClose?.();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Report {target.type}</h3>
          <button type="button" onClick={onClose} className="text-[#6b7280]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-2">
          {reasons.map((item) => (
            <label
              key={item.value}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-[#e5e7eb] px-3 py-2 hover:bg-[#f8fafc]"
            >
              <input
                type="radio"
                name="report-reason"
                value={item.value}
                checked={reason === item.value}
                onChange={(event) => setReason(event.target.value)}
                className="accent-[#1877f2]"
              />
              <span className="text-sm font-semibold">{item.label}</span>
            </label>
          ))}
        </div>

        <textarea
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          maxLength={1000}
          placeholder="Add details"
          className="mt-4 h-24 w-full resize-none rounded-md border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-[#1877f2]"
        />

        {error ? (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#e5e7eb] px-4 py-2 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-[#1877f2] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit report"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportModal;
