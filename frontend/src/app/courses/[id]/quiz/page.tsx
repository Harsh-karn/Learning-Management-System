"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

type Question = {
  id: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
};

type Quiz = {
  id: number;
  title: string;
  questions: Question[];
};

export default function TakeQuiz() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const { jwt, user } = useAuth();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [pastResult, setPastResult] = useState<number | null>(null);

  useEffect(() => {
    const fetchQuizAndResults = async () => {
      try {
        // Fetch Quiz
        const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/quizzes?filters[course][id][$eq]=${courseId}&populate=questions`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        const data = await res.json();
        
        if (data.data && data.data.length > 0) {
          const q = data.data[0];
          setQuiz({
            id: q.documentId || q.id,
            title: q.title,
            questions: q.questions || []
          });

          // Fetch previous result if any
          const resResult = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/quiz-results?filters[quiz][id][$eq]=${q.id}&filters[student][id][$eq]=${user?.id}`, {
            headers: { Authorization: `Bearer ${jwt}` },
          });
          const resultData = await resResult.json();
          if (resultData.data && resultData.data.length > 0) {
            setPastResult(resultData.data[0].score);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (jwt && courseId && user) fetchQuizAndResults();
  }, [jwt, courseId, user]);

  const handleSelect = (qIndex: number, optIndex: number) => {
    setAnswers({ ...answers, [qIndex]: optIndex });
  };

  const handleSubmit = async () => {
    if (!quiz || !user) return;
    
    // Auto-grading
    let score = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctOptionIndex) {
        score++;
      }
    });

    const percentage = Math.round((score / quiz.questions.length) * 100);
    setResult(percentage);
    setSubmitting(true);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/quiz-results`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify({
          data: {
            score: percentage,
            quiz: quiz.id,
            student: user.id
          }
        })
      });
    } catch (err) {
      console.error("Failed to save result", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loader">Loading quiz...</div>;
  if (!quiz) return <div className="container"><h2>No quiz available for this course.</h2></div>;

  return (
    <ProtectedRoute>
      <div className="course-detail-container">
        <h1>{quiz.title}</h1>
        
        {pastResult !== null && result === null && (
          <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: "1rem", borderRadius: "0.5rem", border: "1px solid var(--primary-color)", marginBottom: "1.5rem" }}>
            <strong>Previous Score: {pastResult}%</strong>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem" }}>You have already taken this quiz. Taking it again will save a new result.</p>
          </div>
        )}

        {result !== null ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
            <h2>Quiz Complete!</h2>
            <div style={{ fontSize: "4rem", fontWeight: "bold", color: result >= 50 ? "#10b981" : "#ef4444", margin: "1.5rem 0" }}>
              {result}%
            </div>
            <p style={{ marginBottom: "2rem", color: "var(--text-muted)" }}>
              {result >= 50 ? "Great job!" : "Keep practicing and try again."}
            </p>
            <button onClick={() => router.push(`/courses/${courseId}`)} className="primary-button">
              Back to Course
            </button>
          </div>
        ) : (
          <div className="card" style={{ gap: "2rem" }}>
            {quiz.questions.map((q, idx) => (
              <div key={idx} style={{ marginBottom: "2rem", paddingBottom: "2rem", borderBottom: idx < quiz.questions.length - 1 ? "1px solid var(--border-color)" : "none" }}>
                <h3 style={{ marginBottom: "1rem" }}>{idx + 1}. {q.text}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {q.options.map((opt, oIdx) => (
                    <label key={oIdx} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem", background: answers[idx] === oIdx ? "rgba(59, 130, 246, 0.15)" : "#f9fafb", border: answers[idx] === oIdx ? "1px solid var(--primary-color)" : "1px solid var(--border-color)", borderRadius: "0.5rem", cursor: "pointer", transition: "all 0.2s" }}>
                      <input 
                        type="radio" 
                        name={`question-${idx}`}
                        checked={answers[idx] === oIdx}
                        onChange={() => handleSelect(idx, oIdx)}
                        style={{ transform: "scale(1.2)" }}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={handleSubmit} 
                disabled={submitting || Object.keys(answers).length < quiz.questions.length} 
                className="primary-button"
                style={{ width: "100%", maxWidth: "300px" }}
              >
                {submitting ? "Submitting..." : "Submit Quiz"}
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
