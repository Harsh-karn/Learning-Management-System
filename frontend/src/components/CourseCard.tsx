import React from 'react';

export type Course = {
  id: number;
  title: string;
  description: string;
  instructor?: {
    username: string;
  };
};

export default function CourseCard({ course, onClick }: { course: Course; onClick?: () => void }) {
  return (
    <div className="card course-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <h3>{course.title}</h3>
      <p>{course.description || "No description provided."}</p>
      {course.instructor && (
        <small className="instructor-text">Instructor: {course.instructor.username}</small>
      )}
    </div>
  );
}
