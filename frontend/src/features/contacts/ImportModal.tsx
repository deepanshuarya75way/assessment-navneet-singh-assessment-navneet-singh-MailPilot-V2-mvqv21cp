import React, { useState } from 'react';

export function ImportModal({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [step, setStep] = useState<'upload' | 'preview' | 'processing'>('upload');
  const [fileData, setFileData] = useState<any>(null);
  const [strategy, setStrategy] = useState<'skip' | 'update' | 'reject'>('skip');
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const text = await file.text();
    const lines = text.split('\n').filter((l) => l.trim().length > 0);

    const rows = lines.map((line) => {
      const parts = line.split(',');
      return { email: parts[0]?.trim(), name: parts[1]?.trim() || '' };
    });

    const res = await fetch('/api/contacts/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, rows })
    });
    const data = await res.json();

    setFileData(data);
    setLoading(false);
    setStep('preview');
  };

  const handleCommit = async () => {
    setLoading(true);
    setStep('processing');

    await fetch('/api/contacts/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: fileData.filename,
        validRows: fileData.validRows,
        summary: fileData.summary,
        conflictStrategy: strategy
      })
    });

    setLoading(false);
    onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-xl w-full shadow-xl text-black">
        <h2 className="text-xl font-bold mb-4">Bulk Import Recipients</h2>

        {step === 'upload' && (
          <div>
            <input type="file" accept=".csv,.txt" onChange={handleFileUpload} disabled={loading} className="border p-2 w-full rounded" />
            {loading && <p className="mt-2 text-sm text-gray-500">Parsing and checking records...</p>}
          </div>
        )}

        {step === 'preview' && fileData && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              <div className="bg-gray-100 p-2 rounded">Total: <b>{fileData.summary.totalRows}</b></div>
              <div className="bg-green-100 p-2 rounded">Valid: <b>{fileData.summary.validCount}</b></div>
              <div className="bg-yellow-100 p-2 rounded">Duplicates: <b>{fileData.summary.duplicateCount}</b></div>
              <div className="bg-red-100 p-2 rounded">Errors: <b>{fileData.summary.errorCount}</b></div>
            </div>

            {fileData.summary.duplicateCount > 0 && (
              <div className="space-y-1">
                <label className="text-sm font-semibold">Duplicate Resolution Strategy:</label>
                <select
                  className="w-full border p-2 rounded"
                  value={strategy}
                  onChange={(e: any) => setStrategy(e.target.value)}
                >
                  <option value="skip">Skip existing contacts (keep original)</option>
                  <option value="update">Update existing contacts with new information</option>
                  <option value="reject">Reject batch if duplicates exist</option>
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <button className="px-4 py-2 border rounded" onClick={onClose}>Cancel</button>
              <button
                className="px-4 py-2 bg-emerald-600 text-white rounded font-semibold"
                onClick={handleCommit}
              >
                Commit Import
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-8">
            <p className="font-medium text-gray-700">Reconciling records and writing to database...</p>
          </div>
        )}
      </div>
    </div>
  );
}