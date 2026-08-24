"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

type Lesson = {
  id: number;
  title: string;
  content?: string;
  videoUrl?: string;
  sequence: number;
};

type Progress = {
  id: number;
  completed: boolean;
  lesson: { id: number };
};

export default function LessonPage() {
  const params = useParams();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;
  const router = useRouter();
  const { jwt, user } = useAuth();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [progressData, setProgressData] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch lesson details
        const lessonRes = await fetch(`http://localhost:1337/api/lessons/${lessonId}`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        const lessonData = await lessonRes.json();
        
        // Fetch course lessons to determine sequence/next
        const courseRes = await fetch(`http://localhost:1337/api/courses/${courseId}?populate=lessons`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        const courseData = await courseRes.json();
        
        // Fetch user progress for this course
        const progressRes = await fetch(`http://localhost:1337/api/progresses?filters[course][id][$eq]=${courseId}&filters[student][id][$eq]=${user?.id}&populate=lesson`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        const progressD = await progressRes.json();

        if (lessonData.data) {
          const l = lessonData.data;
          setLesson({ id: l.documentId || l.id, ...l });
        }
        
        if (courseData.data?.lessons) {
          setCourseLessons(courseData.data.lessons.sort((a: any, b: any) => a.sequence - b.sequence));
        }

        if (progressD.data) {
          setProgressData(progressD.data);
        }

      } catch (err) {
        console.error("Failed to fetch lesson data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (jwt && user) fetchData();
  }, [jwt, user, courseId, lessonId]);

  const markComplete = async () => {
    setCompleting(true);
    try {
      const existingProgress = progressData.find(p => p.lesson.id.toString() === lessonId);
      
      if (existingProgress) {
        // Update to complete
        await fetch(`http://localhost:1337/api/progresses/${existingProgress.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`
          },
          body: JSON.stringify({ data: { completed: true } })
        });
      } else {
        // Create new progress entry
        await fetch(`http://localhost:1337/api/progresses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`
          },
          body: JSON.stringify({
            data: {
              completed: true,
              student: user?.id,
              course: courseId,
              lesson: lessonId
            }
          })
        });
      }

      // Go to next lesson if available, or back to course
      const currentIndex = courseLessons.findIndex(l => l.id.toString() === lessonId);
      if (currentIndex !== -1 && currentIndex < courseLessons.length - 1) {
        const nextLesson = courseLessons[currentIndex + 1];
        router.push(`/courses/${courseId}/lessons/${nextLesson.id}`);
      } else {
        // Redirect to quiz if exists, otherwise course details
        router.push(`/courses/${courseId}/quiz`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return <div className="loader">Loading lesson...</div>;
  if (!lesson) return <div className="container"><h2>Lesson not found.</h2></div>;

  const isCompleted = progressData.some(p => p.lesson.id.toString() === lessonId && p.completed);
  
  // Calculate total progress
  const completedCount = progressData.filter(p => p.completed).length + (isCompleted ? 0 : 1 /* if marking now */) - (isCompleted ? 1 : 0); 
  // actually, let's just use what's in progressData for the bar, but the requirement is "show the student's progress percentage".
  const totalLessons = courseLessons.length || 1;
  const currentCompletedCount = progressData.filter(p => p.completed).length;
  const progressPercentage = Math.round((currentCompletedCount / totalLessons) * 100);

  return (
    <ProtectedRoute>
      <div className="lesson-container">
        <div className="lesson-sidebar">
          <h3>Course Progress</h3>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <p>{progressPercentage}% Completed</p>
          
          <ul className="sidebar-lessons">
            {courseLessons.map((l, idx) => {
              const isThisCompleted = progressData.some(p => p.lesson.id === l.id && p.completed);
              const isCurrent = l.id.toString() === lessonId;
              return (
                <li key={l.id} className={`sidebar-lesson-item ${isCurrent ? 'current' : ''}`}>
                  <span className="lesson-idx">{idx + 1}</span>
                  <button onClick={() => router.push(`/courses/${courseId}/lessons/${l.id}`)} className="sidebar-link">
                    {l.title}
                  </button>
                  {isThisCompleted && <span className="check-icon">✓</span>}
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="lesson-content">
          <div className="lesson-header">
            <h2>{lesson.title}</h2>
          </div>
          
          {lesson.videoUrl && (
            <div className="lesson-video">
              <iframe 
                src={lesson.videoUrl} 
                frameBorder="0" 
                allow="autoplay; fullscreen" 
                allowFullScreen
                title={lesson.title}
              ></iframe>
            </div>
          )}
          
          <div className="lesson-body" dangerouslySetInnerHTML={{ __html: lesson.content || "" }} />
          
          <div className="lesson-footer">
            <button 
              onClick={markComplete} 
              disabled={completing || isCompleted} 
              className="primary-button"
            >
              {isCompleted ? "Completed" : completing ? "Marking..." : "Mark as Complete & Continue"}
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
