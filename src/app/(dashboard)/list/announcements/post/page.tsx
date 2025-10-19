"use client";

import { useState } from "react";

// adjust these to match your enums if different
type Role = "ADMIN" | "INSTRUCTOR" | "STUDENT" | "REGISTRAR" | "STAFF" | "ALL";
type Status = "ACTIVE" | "INACTIVE" | "ARCHIVED";
type Priority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export default function PostAnnouncementPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [userType, setUserType] = useState<Role>("STUDENT");
  const [isGeneral, setIsGeneral] = useState(true);
  const [subjectId, setSubjectId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [status, setStatus] = useState<Status>("ACTIVE");
  const [priority, setPriority] = useState<Priority>("NORMAL");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // TODO: replace with real logged-in user id
  const createdby = 2;

  async function submit() {
    setMsg("");
    if (!title.trim()) return setMsg("Title is required");
    if (!content.trim()) return setMsg("Content is required");
    if (!isGeneral && !subjectId && !sectionId && !instructorId) {
      return setMsg("Provide subjectId, sectionId, or instructorId (or mark as General)");
    }

    const payload: any = {
      title: title.trim(),
      content: content.trim(),
      userType,
      isGeneral,
      status,
      priority,
      createdby,
    };
    if (subjectId) payload.subjectId = Number(subjectId);
    if (sectionId) payload.sectionId = Number(sectionId);
    if (instructorId) payload.instructorId = Number(instructorId);

    setSaving(true);
    try {
      const r = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) {
        setMsg(j?.error ?? "Failed to post");
        return;
        }
      setMsg("Announcement posted ✔");
      setTitle("");
      setContent("");
      setIsGeneral(true);
      setSubjectId("");
      setSectionId("");
      setInstructorId("");
      setPriority("NORMAL");
      setStatus("ACTIVE");
    } catch (e: any) {
      setMsg(e?.message ?? "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Post Announcement</h1>
        <button
          onClick={submit}
          disabled={saving}
          className="px-4 py-2 rounded bg-gray-900 text-white text-sm disabled:opacity-60"
        >
          {saving ? "Posting…" : "Post"}
        </button>
      </div>

      {msg && <div className="rounded border px-3 py-2 text-sm">{msg}</div>}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <label className="block text-sm text-gray-600">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Announcement title"
          />

          <label className="block text-sm text-gray-600 mt-4">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm min-h-[160px]"
            placeholder="Type your message…"
          />
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-600">Audience (userType)</label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value as Role)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="ALL">ALL</option>
              <option value="STUDENT">STUDENT</option>
              <option value="INSTRUCTOR">INSTRUCTOR</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isGeneral}
              onChange={(e) => setIsGeneral(e.target.checked)}
            />
            General (applies to everyone in this user type)
          </label>

          {!isGeneral && (
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">Subject ID</span>
                <input
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="border rounded px-3 py-2 text-sm"
                  placeholder="e.g. 101"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">Section ID</span>
                <input
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="border rounded px-3 py-2 text-sm"
                  placeholder="e.g. 12"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-gray-600">Instructor ID</span>
                <input
                  value={instructorId}
                  onChange={(e) => setInstructorId(e.target.value)}
                  className="border rounded px-3 py-2 text-sm"
                  placeholder="e.g. 2"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="LOW">LOW</option>
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Tip: replace raw IDs with dropdowns loaded from your Subjects / Sections / Instructors APIs later.
          </p>
        </div>
      </div>
    </div>
  );
}
