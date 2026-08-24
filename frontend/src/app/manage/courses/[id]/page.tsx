"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

type Lesson = { id: number; title: string; sequence: number };

export default function ManageCourseDetail() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { jwt } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newLessonTitle, setNewLessonTitle] = useState("");

  const fetchCourse = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/courses/${id}?populate=lessons`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const data = await res.json();
      if (data.data) {
        setCourse({
          ...data.data,
          id: data.data.documentId || data.data.id,
          lessons: data.data.lessons?.sort((a: any, b: any) => a.sequence - b.sequence) || []
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jwt && id) fetchCourse();
  }, [jwt, id]);

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle) return;
    
    try {
      const sequence = (course.lessons?.length || 0) + 1;
      const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/lessons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify({
          data: {
            title: newLessonTitle,
            sequence,
            course: course.id
          }
        })
      });
      
      if (res.ok) {
        setNewLessonTitle("");
        fetchCourse(); // Refresh
      }
    } catch (err) {
      console.error("Failed to add lesson", err);
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/lessons/${lessonId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwt}` }
      });
      fetchCourse();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loader">Loading...</div>;
  if (!course) return <div className="container"><h2>Course not found.</h2></div>;

  return (
    <ProtectedRoute allowedRoles={["Admin", "Content Manager", "Instructor"]}>
      <div className="course-detail-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>Edit Course: {course.title}</h1>
        </div>

        <div className="card">
          <h3>Manage Lessons</h3>
          
          <form onSubmit={handleAddLesson} style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
            <input 
              type="text" 
              placeholder="New Lesson Title" 
              value={newLessonTitle} 
              onChange={e => setNewLessonTitle(e.target.value)} 
              required
              style={{ flex: 1, padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", background: "transparent", color: "white" }}
            />
            <button type="submit" className="primary-button">Add Lesson</button>
          </form>

          <ul className="lesson-list">
            {course.lessons.map((lesson: Lesson, idx: number) => (
              <li key={lesson.id} className="lesson-item" style={{ justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span className="lesson-number">{idx + 1}</span>
                  <span className="lesson-title">{lesson.title}</span>
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button onClick={() => router.push(`/manage/lessons/${lesson.id}`)} className="text-button">Edit</button>
                  <button onClick={() => handleDeleteLesson(lesson.id)} className="text-button" style={{ color: "var(--error-color)" }}>Delete</button>
                </div>
              </li>
            ))}
            {course.lessons.length === 0 && <p>No lessons added yet.</p>}
          </ul>
        </div>
        
        <div className="card">
          <h3>Manage Quiz</h3>
          <p>Each course can have one auto-graded MCQ quiz.</p>
          <button onClick={() => router.push(`/manage/courses/${id}/quiz`)} className="secondary-button" style={{ width: "fit-content", marginTop: "1rem" }}>
            Edit Course Quiz
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
