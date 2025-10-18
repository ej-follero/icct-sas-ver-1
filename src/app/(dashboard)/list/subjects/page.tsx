'use client';

import React, { useEffect, useState } from 'react';
import { Search, Plus, BookOpen, Edit2, Loader2, AlertCircle, X } from 'lucide-react';

type Subject = {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // add form
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  async function fetchSubjects() {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/subjects?q=${encodeURIComponent(search)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch subjects');
      setSubjects(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch subjects');
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }

  async function addSubject() {
    if (!newCode.trim() || !newName.trim()) return alert('Please fill both fields');
    try {
      setLoading(true);
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectCode: newCode.trim(),
          subjectName: newName.trim(),
          // You can pass optional advanced fields here if you like.
          // The API already fills safe defaults (departmentId/courseId, etc.).
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to add subject');
      setNewCode('');
      setNewName('');
      setShowAddForm(false);
      fetchSubjects();
    } catch (e: any) {
      alert(e?.message || 'Failed to add subject');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSubjects(); }, [search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Subjects
              </h1>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Manage all subjects in the system
              </p>
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-white shadow-md hover:shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAddForm ? 'Cancel' : 'Add Subject'}
            </button>
          </div>
        </div>

        {/* Add Subject Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-in slide-in-from-top duration-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Subject</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Code</label>
                <input
                  type="text"
                  placeholder="e.g., CS101"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g., Introduction to Computer Science"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={addSubject}
                disabled={loading || !newCode.trim() || !newName.trim()}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Adding...</>) : (<><Plus className="w-4 h-4" />Add Subject</>)}
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="relative max-w-md ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Subject Code</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Subject Name</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                        <p className="text-sm text-gray-500">Loading subjects...</p>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && subjects.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">No subjects found</h3>
                          <p className="text-sm text-gray-500">
                            {search ? 'Try adjusting your search query' : 'Get started by adding your first subject'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && subjects.map((s) => (
                  <tr key={s.subjectId} className="hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm font-semibold">
                        {s.subjectCode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 font-medium">{s.subjectName}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`/list/subjects/${s.subjectId}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition-all text-sm font-medium shadow-sm hover:shadow"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer count */}
        {!loading && subjects.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-600 text-center">
              Showing <span className="font-semibold text-gray-900">{subjects.length}</span>{' '}
              {subjects.length === 1 ? 'subject' : 'subjects'}
              {search && <> matching "<span className="font-medium text-purple-600">{search}</span>"</>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
