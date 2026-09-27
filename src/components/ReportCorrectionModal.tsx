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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-[24px] bg-surface p-5 shadow-tactile-xl border border-[#eae6df] flex flex-col gap-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#eae6df]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">flag</span>
            <span className="text-[15px] font-extrabold text-on-surface">Report Incorrect Info</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface shadow-tactile-inset-sm"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {receipt ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[36px] text-emerald-600">task_alt</span>
            <h3 className="text-[15px] font-extrabold text-emerald-900">Correction Received</h3>
            <p className="text-[11px] text-emerald-700">
              Assigned to regional verification queue under receipt:
            </p>
            <span className="px-3 py-1 rounded-full bg-white font-mono text-[12px] font-bold text-emerald-800 border border-emerald-200">
              {receipt.reportId}
            </span>
            <p className="text-[10px] text-emerald-600 mt-1">
              v8 Security Requirement: Emergency changes require two-person publication approval before deployment.
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-[12px] shadow-sm active:scale-98"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <p className="text-[11px] text-on-surface-variant font-medium">
              Reporting for <strong className="text-on-surface">{place.name}</strong>
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-extrabold uppercase text-outline">Issue Category</label>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {[
                  { id: 'hours' as const, label: 'Opening Hours' },
                  { id: 'closed' as const, label: 'Permanently Closed' },
                  { id: 'location' as const, label: 'Wrong Location' },
                  { id: 'safety' as const, label: 'Safety / Emergency' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`py-2 px-2.5 rounded-xl border text-center font-bold transition-all ${
                      category === cat.id
                        ? 'bg-[#E0F2FE] border-[#BAE6FD] text-primary shadow-tactile-inset-sm'
                        : 'bg-surface border-[#eae6df] text-on-surface shadow-tactile'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-extrabold uppercase text-outline">Description / Evidence</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the discrepancy (e.g. clinic entrance moved to east gate)..."
                rows={3}
                maxLength={2000}
                required
                className="w-full p-2.5 rounded-xl bg-surface-container shadow-tactile-inset-sm border border-[#eae6df] text-[12px] text-on-surface outline-none resize-none"
              />
            </div>

            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-surface border border-[#eae6df] text-outline text-[12px] font-bold shadow-tactile active:scale-98"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !description.trim()}
                className="flex-1 py-2.5 rounded-xl tactile-btn-primary text-white text-[12px] font-bold shadow-tactile-primary active:scale-98 disabled:opacity-50"
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
