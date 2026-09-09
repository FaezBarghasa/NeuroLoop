import React, { useState } from "react";

interface FeedbackDialogProps {
  sessionId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: {
    rating: number;
    helpful: boolean;
    tooIntense: boolean;
    tooQuiet: boolean;
    discomfort: boolean;
    tags: string[];
    note: string;
  }) => void;
}

export const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [rating, setRating] = useState<number>(4);
  const [helpful, setHelpful] = useState<boolean>(true);
  const [tooIntense, setTooIntense] = useState<boolean>(false);
  const [tooQuiet, setTooQuiet] = useState<boolean>(false);
  const [discomfort, setDiscomfort] = useState<boolean>(false);
  const [note, setNote] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  if (!isOpen) return null;

  const availableTags = [
    "Helped Sleep",
    "Helped Focus",
    "Relaxing",
    "Uncomfortable",
    "Too Intense",
    "Too Quiet",
    "Smooth Fade",
    "Pleasant Tone",
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    onSubmit({
      rating,
      helpful,
      tooIntense,
      tooQuiet,
      discomfort,
      tags: selectedTags,
      note,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
        <h3 className="text-xl font-bold mb-1">Session Feedback</h3>
        <p className="text-sm text-slate-400 mb-6">
          How effective was this A432 audio session for you?
        </p>

        {/* Rating */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Overall Rating
          </label>
          <div className="flex gap-2 justify-between">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`w-12 h-12 rounded-xl text-lg font-bold transition-all ${
                  rating === star
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {star} ★
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setHelpful(!helpful)}
            className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${
              helpful
                ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
                : "bg-slate-800/50 border-slate-700 text-slate-400"
            }`}
          >
            ✓ Helpful Session
          </button>

          <button
            type="button"
            onClick={() => setDiscomfort(!discomfort)}
            className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${
              discomfort
                ? "bg-rose-950/60 border-rose-500/50 text-rose-300"
                : "bg-slate-800/50 border-slate-700 text-slate-400"
            }`}
          >
            ⚠️ Discomfort
          </button>
        </div>

        {/* Tags */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Quick Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedTags.includes(tag)
                    ? "bg-indigo-600/30 border border-indigo-500/50 text-indigo-200"
                    : "bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional comments or notes..."
            rows={2}
            className="w-full bg-slate-800/70 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20"
          >
            Save Feedback
          </button>
        </div>
      </div>
    </div>
  );
};
