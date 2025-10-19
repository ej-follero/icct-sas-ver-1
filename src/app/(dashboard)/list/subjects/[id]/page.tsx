'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, AlertCircle, BookOpen, Check } from 'lucide-react';

type Subject = {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
};

export default function EditSubjectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fetchSubject = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/subjects/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch subject');
      setSubject(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSubject = async () => {
    if (!subject) return;
    try {
      setSaving(true);
      setError('');
      const res = await fetch(`/api/subjects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update subject');
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/list/subjects');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (id) fetchSubject();
  }, [id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.push('/list/subjects')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Subjects</span>
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Subject</h1>
              <p className="text-sm text-gray-500">Update subject information</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm animate-in slide-in-from-top duration-200">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">Subject updated successfully!</p>
                <p className="text-xs text-green-700 mt-1">Redirecting to subjects list...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <p className="text-sm text-gray-500">Loading subject details...</p>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {!loading && subject && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject Code
                </label>
                <input
                  type="text"
                  value={subject.subjectCode}
                  onChange={(e) =>
                    setSubject({ ...subject, subjectCode: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-gray-900 font-medium"
                  placeholder="e.g., CS101"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Enter a unique identifier for this subject
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={subject.subjectName}
                  onChange={(e) =>
                    setSubject({ ...subject, subjectName: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition text-gray-900"
                  placeholder="e.g., Introduction to Computer Science"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  The full name of the subject
                </p>
              </div>
            </div>

            {/* Preview Card */}
            <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-4 border border-purple-100">
              <p className="text-xs font-semibold text-purple-900 uppercase tracking-wide mb-2">
                Preview
              </p>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm font-semibold">
                  {subject.subjectCode || 'CODE'}
                </span>
                <span className="text-gray-900 font-medium">
                  {subject.subjectName || 'Subject Name'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={updateSubject}
                disabled={saving || !subject.subjectCode.trim() || !subject.subjectName.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-medium"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                onClick={() => router.push('/list/subjects')}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-200 px-6 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Before you save
              </h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Make sure the subject code is unique</li>
                <li>• Subject name should be descriptive and clear</li>
                <li>• Changes will be reflected immediately across the system</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}