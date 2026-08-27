"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

type User = {
  id: number;
  username: string;
  email: string;
  role: { id: number; name: string };
};

type Role = {
  id: number;
  name: string;
};

export default function AdminPanel() {
  const { jwt } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [stats, setStats] = useState({ courses: 0, enrollments: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch users
      const usersRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/users?populate=role`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const usersData = await usersRes.json();
      setUsers(usersData);

      // Fetch roles
      const rolesRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/users-permissions/roles`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const rolesData = await rolesRes.json();
      if (rolesData.roles) setRoles(rolesData.roles);

      // Fetch stats (courses)
      const coursesRes = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/courses?populate=students`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const coursesData = await coursesRes.json();
      
      let totalEnrollments = 0;
      if (coursesData.data) {
        coursesData.data.forEach((c: any) => {
          totalEnrollments += c.students?.length || 0;
        });
        setStats({ courses: coursesData.data.length, enrollments: totalEnrollments });
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jwt) fetchData();
  }, [jwt]);

  const handleRoleChange = async (userId: number, roleId: number) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify({ role: roleId })
      });
      fetchData(); // Refresh list
    } catch (err) {
      console.error(err);
      alert("Failed to update role");
    }
  };

  if (loading) return <div className="loader">Loading Admin Panel...</div>;

  const roleCounts: Record<string, number> = {};
  users.forEach(u => {
    const rName = u.role?.name || "None";
    roleCounts[rName] = (roleCounts[rName] || 0) + 1;
  });

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <div className="course-detail-container" style={{ maxWidth: "1200px" }}>
        <h1>Admin Dashboard</h1>
        
        <div className="card-grid" style={{ marginBottom: "2rem" }}>
          <div className="card" style={{ alignItems: "center", textAlign: "center" }}>
            <h3>Total Users</h3>
            <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary-color)" }}>{users.length}</p>
          </div>
          <div className="card" style={{ alignItems: "center", textAlign: "center" }}>
            <h3>Total Courses</h3>
            <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary-color)" }}>{stats.courses}</p>
          </div>
          <div className="card" style={{ alignItems: "center", textAlign: "center" }}>
            <h3>Total Enrollments</h3>
            <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary-color)" }}>{stats.enrollments}</p>
          </div>
        </div>

        <div className="card" style={{ marginBottom: "2rem" }}>
          <h3>Users by Role</h3>
          <div style={{ display: "flex", gap: "2rem", marginTop: "1rem" }}>
            {Object.entries(roleCounts).map(([role, count]) => (
              <div key={role} style={{ background: "#f3f4f6", padding: "1rem", borderRadius: "0.5rem", flex: 1, textAlign: "center", border: "1px solid var(--border-color)" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>{role}</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>User Management</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                <th style={{ padding: "1rem" }}>ID</th>
                <th style={{ padding: "1rem" }}>Username</th>
                <th style={{ padding: "1rem" }}>Email</th>
                <th style={{ padding: "1rem" }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: "1rem" }}>{u.id}</td>
                  <td style={{ padding: "1rem", fontWeight: "500" }}>{u.username}</td>
                  <td style={{ padding: "1rem", color: "#94a3b8" }}>{u.email}</td>
                  <td style={{ padding: "1rem" }}>
                    <select 
                      value={u.role?.id || ""} 
                      onChange={(e) => handleRoleChange(u.id, parseInt(e.target.value))}
                      style={{ padding: "0.4rem", borderRadius: "0.25rem", background: "#fff", color: "inherit", border: "1px solid var(--border-color)" }}
                    >
                      <option value="" disabled>Select Role</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedRoute>
  );
}
