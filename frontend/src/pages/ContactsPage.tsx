import React, { useState } from 'react';
import { ImportModal } from '@/features/contacts/ImportModal';
import { ImportHistory } from '@/features/contacts/ImportHistory';

export function ContactsPage() {
  const [showModal, setShowModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Contacts & Audience</h1>
          <p className="text-gray-500 text-sm">Manage contacts and import recipient lists in bulk</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-md shadow"
        >
          Import Contacts
        </button>
      </div>

      {showModal && (
        <ImportModal
          onClose={() => setShowModal(false)}
          onComplete={() => setRefreshTrigger((prev) => prev + 1)}
        />
      )}

      <ImportHistory refreshTrigger={refreshTrigger} />
    </div>
  );
}