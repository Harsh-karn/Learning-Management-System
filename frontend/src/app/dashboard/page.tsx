"use client";

import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Dashboard() {
  const { user, logout } = useAuth();

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
            <div className="card">
              <h3>My Courses</h3>
              <p>View courses you are enrolled in.</p>
              <a href="/courses" className="card-link">Go to Courses &rarr;</a>
            </div>

            {(user?.role?.name === "Admin" || user?.role?.name === "Content Manager") && (
              <div className="card">
                <h3>Manage Platform</h3>
                <p>Manage all courses, lessons, and quizzes.</p>
                <a href="/content-manager" className="card-link">Content Manager &rarr;</a>
              </div>
            )}

            {user?.role?.name === "Instructor" && (
              <div className="card">
                <h3>My Teaching</h3>
                <p>Manage your own courses.</p>
                <a href="/instructor" className="card-link">Instructor Panel &rarr;</a>
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
