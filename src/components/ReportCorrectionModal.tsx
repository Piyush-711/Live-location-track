import React, { useState } from 'react';
import { Place } from '../types';
import { api } from '../services/api';

interface ReportCorrectionModalProps {
  place: Place;
  onClose: () => void;
}

export const ReportCorrectionModal: React.FC<ReportCorrectionModalProps> = ({ place, onClose }) => {
  const [category, setCategory] = useState<'hours' | 'closed' | 'location' | 'phone' | 'safety'>('hours');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<{ reportId: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.submitReport({
        placeId: place.id,
        issueCategory: category,
        description: description.trim()
      });
      setReceipt({ reportId: res.reportId });
    } catch (err) {
      console.error('Failed to submit report', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">flag</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">Suggest an Edit</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {receipt ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">task_alt</span>
            </div>
            <h3 className="text-base font-bold text-emerald-950">Thank you for your feedback</h3>
            <p className="text-xs text-emerald-800 leading-relaxed max-w-xs">
              Your edit report has been logged and queued for OpenStreetMap community review.
            </p>
            <span className="px-3 py-1 rounded-full bg-white font-mono text-xs font-semibold text-emerald-800 border border-emerald-200 mt-1">
              Ticket #{receipt.reportId}
            </span>
            <button
              onClick={onClose}
              className="mt-3 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <p className="text-xs text-slate-500 font-medium">
              Reporting an update for <strong className="text-slate-900">{place.name}</strong>
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">What needs to be updated?</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'hours' as const, label: 'Opening Hours' },
                  { id: 'closed' as const, label: 'Permanently Closed' },
                  { id: 'location' as const, label: 'Pin Location' },
                  { id: 'safety' as const, label: 'Emergency Info' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                      category === cat.id
                        ? 'bg-sky-50 border-sky-200 text-sky-900 ring-1 ring-sky-500/20 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Details</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the change (e.g. entrance moved to east gate, new opening hours)..."
                rows={3}
                maxLength={2000}
                required
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-sky-500 resize-none font-medium"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !description.trim()}
                className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
