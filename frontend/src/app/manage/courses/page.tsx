"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import CourseCard, { Course } from "@/components/CourseCard";

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { jwt, user } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        let endpoint = `http://localhost:1337/api/courses?populate=instructor`;
        
        // Instructors only see their own courses
        if (user?.role?.name === "Instructor") {
          endpoint += `&filters[instructor][id][$eq]=${user.id}`;
        }
        
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        const data = await res.json();
        
        if (data.data) {
          const parsedCourses = data.data.map((c: any) => ({
            id: c.documentId || c.id,
            title: c.title,
            description: c.description,
            instructor: c.instructor,
          }));
          setCourses(parsedCourses);
        }
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      } finally {
        setLoading(false);
      }
    };

    if (jwt && user) fetchCourses();
  }, [jwt, user]);

  const handleCreateCourse = async () => {
    const title = prompt("Enter Course Title:");
    if (!title) return;
    
    try {
      const res = await fetch(`http://localhost:1337/api/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          data: {
            title,
            description: "New Course Description",
            instructor: user?.id,
          }
        }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setCourses([...courses, { id: data.data.documentId || data.data.id, title, description: "New Course Description" }]);
      } else {
        alert("Failed to create course");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Admin", "Content Manager", "Instructor"]}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h1 className="page-title">Manage Courses</h1>
          <button onClick={handleCreateCourse} className="primary-button">Create New Course</button>
        </div>
        
        {loading ? (
          <div className="loader">Loading courses...</div>
        ) : (
          <div className="card-grid">
            {courses.length === 0 ? (
              <p>No courses found.</p>
            ) : (
              courses.map((course) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  onClick={() => router.push(`/manage/courses/${course.id}`)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
