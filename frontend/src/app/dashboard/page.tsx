"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { user, logout, jwt } = useAuth();
  const router = useRouter();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role?.name === "Student" && jwt) {
      const fetchEnrolled = async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/courses?populate=students&filters[students][id][$eq]=${user.id}`, {
            headers: { Authorization: `Bearer ${jwt}` }
          });
          const data = await res.json();
          if (data.data) {
             setEnrolledCourses(data.data);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchEnrolled();
    }
  }, [user, jwt]);

  return (
    <ProtectedRoute>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Welcome, {user?.username}</h1>
          <p>Role: {user?.role?.name || "Student"}</p>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
        
        <div className="dashboard-content">
          {/* Quick links based on role */}
          <div className="card-grid">
            {user?.role?.name === "Student" && (
              <div className="card">
                <h3>My Courses</h3>
                <p>View courses you are enrolled in.</p>
                <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {enrolledCourses.length === 0 ? (
                    <p style={{ fontSize: "14px", color: "var(--text-muted)", padding: "10px", backgroundColor: "#f3f4f6", borderRadius: "5px" }}>
                      <em>You are not enrolled in any courses yet.</em>
                    </p>
                  ) : (
                    enrolledCourses.map(c => (
                       <button key={c.id} onClick={() => router.push(`/courses/${c.documentId || c.id}`)} className="secondary-button" style={{ width: "100%", textAlign: "left", display: "block" }}>
                         {c.title}
                       </button>
                    ))
                  )}
                </div>
                <a href="/courses" className="card-link" style={{ display: 'block', marginTop: '15px' }}>Browse All Courses &rarr;</a>
              </div>
            )}

            {(user?.role?.name === "Admin" || user?.role?.name === "Content Manager") && (
              <div className="card">
                <h3>Manage Platform</h3>
                <p>Manage all courses, lessons, and quizzes.</p>
                <a href="/manage/courses" className="card-link">Content Manager &rarr;</a>
              </div>
            )}

            {user?.role?.name === "Instructor" && (
              <div className="card">
                <h3>My Teaching</h3>
                <p>Manage your own courses.</p>
                <a href="/manage/courses" className="card-link">Instructor Panel &rarr;</a>
              </div>
            )}

            {user?.role?.name === "Admin" && (
              <div className="card">
                <h3>Admin Panel</h3>
                <p>Manage users and roles across the platform.</p>
                <a href="/admin" className="card-link">Go to Admin &rarr;</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
