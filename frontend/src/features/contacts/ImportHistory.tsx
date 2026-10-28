import React, { useEffect, useState } from 'react';

export function ImportHistory({ refreshTrigger }: { refreshTrigger: number }) {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/contacts/history')
      .then((res) => res.json())
      .then((data) => setHistory(data));
  }, [refreshTrigger]);

  return (
    <div className="mt-8 border-t pt-4">
      <h3 className="text-lg font-bold mb-3">Bulk Import History</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-2">File</th>
              <th className="p-2">Strategy</th>
              <th className="p-2">Total</th>
              <th className="p-2">Duplicates</th>
              <th className="p-2">Status</th>
              <th className="p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-2 font-medium">{item.filename}</td>
                <td className="p-2 uppercase text-xs font-semibold">{item.conflictStrategy}</td>
                <td className="p-2">{item.totalRows}</td>
                <td className="p-2">{item.duplicateCount}</td>
                <td className="p-2"><span className="text-green-600 font-bold">{item.status}</span></td>
                <td className="p-2 text-gray-500">{new Date(item.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}