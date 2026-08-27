import { useState } from "react";
import { X, Sparkles } from "lucide-react";

export default function AddTopicModal({ trackName, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(name.trim());
      onClose();
    } catch (err) {
      console.error("Error creating topic:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Topic</h2>
            <p className="text-xs text-gray-500">Inside {trackName || "Track"}</p>
          </div>
        </div>

        <p className="mt-2 text-sm text-gray-500">
          Create a new topic manually in this track to organize your study sessions.
        </p>

        <form onSubmit={handleSubmit} className="mt-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Topic Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Binary Search Trees, React Hooks"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Creating...</span>
                </>
              ) : (
                "Create Topic"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
