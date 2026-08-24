"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

export default function ManageLesson() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { jwt } = useAuth();
  
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/lessons/${id}?populate=course`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        const data = await res.json();
        if (data.data) {
          setLesson({
            ...data.data,
            id: data.data.documentId || data.data.id,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (jwt && id) fetchLesson();
  }, [jwt, id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/lessons/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify({
          data: {
            title: lesson.title,
            content: lesson.content,
            videoUrl: lesson.videoUrl,
            sequence: lesson.sequence
          }
        })
      });
      alert("Saved successfully!");
      if (lesson.course) {
        router.push(`/manage/courses/${lesson.course.documentId || lesson.course.id}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loader">Loading...</div>;
  if (!lesson) return <div className="container"><h2>Lesson not found.</h2></div>;

  return (
    <ProtectedRoute allowedRoles={["Admin", "Content Manager", "Instructor"]}>
      <div className="course-detail-container">
        <h1>Edit Lesson: {lesson.title}</h1>
        
        <form onSubmit={handleSave} className="card" style={{ gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label>Title</label>
            <input 
              type="text" 
              value={lesson.title} 
              onChange={e => setLesson({...lesson, title: e.target.value})} 
              required
              style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", background: "rgba(15, 23, 42, 0.6)", color: "white" }}
            />
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label>Sequence Number</label>
            <input 
              type="number" 
              value={lesson.sequence} 
              onChange={e => setLesson({...lesson, sequence: parseInt(e.target.value)})} 
              required
              style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", background: "rgba(15, 23, 42, 0.6)", color: "white" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label>Video URL (Optional YouTube/Vimeo embed link)</label>
            <input 
              type="url" 
              value={lesson.videoUrl || ""} 
              onChange={e => setLesson({...lesson, videoUrl: e.target.value})} 
              style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", background: "rgba(15, 23, 42, 0.6)", color: "white" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label>Content (Rich Text - HTML supported)</label>
            <textarea 
              value={lesson.content || ""} 
              onChange={e => setLesson({...lesson, content: e.target.value})} 
              rows={10}
              style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", background: "rgba(15, 23, 42, 0.6)", color: "white", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button type="button" onClick={() => router.back()} className="secondary-button">Cancel</button>
            <button type="submit" disabled={saving} className="primary-button">
              {saving ? "Saving..." : "Save Lesson"}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
