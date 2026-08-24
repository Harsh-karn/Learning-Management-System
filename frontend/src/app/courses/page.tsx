"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import CourseCard, { Course } from "@/components/CourseCard";
import { useAuth } from "@/context/AuthContext";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { jwt } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("http://localhost:1337/api/courses?populate=instructor", {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });
        const data = await res.json();
        if (data.data) {
          // Strapi v5 returns data array
          const parsedCourses = data.data.map((c: any) => ({
            id: c.documentId || c.id, // v5 documentId or v4 id
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

    if (jwt) {
      fetchCourses();
    }
  }, [jwt]);

  return (
    <ProtectedRoute>
      <div>
        <h1 className="page-title">Available Courses</h1>
        {loading ? (
          <div className="loader">Loading courses...</div>
        ) : (
          <div className="card-grid">
            {courses.length === 0 ? (
              <p>No courses available right now.</p>
            ) : (
              courses.map((course) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  onClick={() => router.push(`/courses/${course.id}`)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
