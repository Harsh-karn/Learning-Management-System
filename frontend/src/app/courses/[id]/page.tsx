"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

type Lesson = {
  id: number;
  title: string;
  sequence: number;
};

type CourseDetail = {
  id: number;
  title: string;
  description: string;
  instructor?: { username: string };
  lessons?: Lesson[];
  students?: { id: number }[];
};

export default function CourseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { jwt, user } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`http://localhost:1337/api/courses/${id}?populate=instructor,lessons,students`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        const data = await res.json();
        
        if (data.data) {
          const c = data.data;
          setCourse({
            id: c.documentId || c.id,
            title: c.title,
            description: c.description,
            instructor: c.instructor,
            lessons: c.lessons?.sort((a: any, b: any) => a.sequence - b.sequence) || [],
            students: c.students || [],
          });
        }
      } catch (err) {
        console.error("Failed to fetch course details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (jwt && id) {
      fetchCourse();
    }
  }, [jwt, id]);

  const handleEnroll = async () => {
    if (!course || !user) return;
    setEnrolling(true);
    setError("");
    
    try {
      const isEnrolled = course.students?.some(s => s.id === user.id);
      if (isEnrolled) {
        router.push(`/courses/${id}/lessons/${course.lessons?.[0]?.id || ""}`);
        return;
      }

      // In Strapi v5, updating a relation requires updating the document
      const updatedStudents = [...(course.students || []).map(s => s.id), user.id];
      
      const res = await fetch(`http://localhost:1337/api/courses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify({
          data: {
            students: updatedStudents
          }
        })
      });

      if (!res.ok) {
        throw new Error("Failed to enroll");
      }

      // Success, refresh
      setCourse({
        ...course,
        students: [...(course.students || []), { id: user.id }]
      });
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="loader">Loading course...</div>;
  if (!course) return <div className="container"><h2>Course not found.</h2></div>;

  const isEnrolled = course.students?.some(s => s.id === user?.id);
  const canManage = user?.role?.name === "Admin" || user?.role?.name === "Content Manager" || (user?.role?.name === "Instructor" && course.instructor?.username === user?.username);

  return (
    <ProtectedRoute>
      <div className="course-detail-container">
        <h1>{course.title}</h1>
        <p className="instructor-text">Instructor: {course.instructor?.username || "Unknown"}</p>
        
        <div className="course-description card">
          <h3>Description</h3>
          <p>{course.description}</p>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="course-actions">
          {user?.role?.name === "Student" && (
            <button onClick={handleEnroll} disabled={enrolling} className="primary-button">
              {enrolling ? "Enrolling..." : isEnrolled ? "Continue Learning" : "Enroll Now"}
            </button>
          )}
          {canManage && (
            <button className="secondary-button">Edit Course</button>
          )}
        </div>

        <div className="course-lessons">
          <h3>Lessons</h3>
          {course.lessons?.length === 0 ? (
            <p>No lessons added yet.</p>
          ) : (
            <ul className="lesson-list">
              {course.lessons?.map((lesson, idx) => (
                <li key={lesson.id} className="lesson-item">
                  <span className="lesson-number">{idx + 1}</span>
                  <span className="lesson-title">{lesson.title}</span>
                  {(isEnrolled || canManage) && (
                    <button onClick={() => router.push(`/courses/${id}/lessons/${lesson.id}`)} className="text-button">
                      View
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
