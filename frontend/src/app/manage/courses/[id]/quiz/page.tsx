"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

type Question = {
  id?: number;
  text: string;
  options: string[];
  correctOptionIndex: number;
};

export default function ManageQuiz() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const { jwt } = useAuth();
  
  const [quizId, setQuizId] = useState<number | null>(null);
  const [title, setTitle] = useState("Course Quiz");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch(`http://localhost:1337/api/quizzes?filters[course][id][$eq]=${courseId}&populate=questions`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        const data = await res.json();
        
        if (data.data && data.data.length > 0) {
          const q = data.data[0];
          setQuizId(q.documentId || q.id);
          setTitle(q.title);
          setQuestions(q.questions || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (jwt && courseId) fetchQuiz();
  }, [jwt, courseId]);

  const addQuestion = () => {
    setQuestions([...questions, { text: "", options: ["", "", "", ""], correctOptionIndex: 0 }]);
  };

  const updateQuestion = (idx: number, field: string, value: any, optionIdx?: number) => {
    const newQ = [...questions];
    if (field === "text") newQ[idx].text = value;
    if (field === "correct") newQ[idx].correctOptionIndex = value;
    if (field === "option" && optionIdx !== undefined) {
      newQ[idx].options[optionIdx] = value;
    }
    setQuestions(newQ);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        data: {
          title,
          course: courseId,
          questions: questions.map(q => ({
            __component: "quiz.question",
            text: q.text,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex
          }))
        }
      };

      if (quizId) {
        // Update
        await fetch(`http://localhost:1337/api/quizzes/${quizId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create
        await fetch(`http://localhost:1337/api/quizzes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`
          },
          body: JSON.stringify(payload)
        });
      }
      alert("Quiz saved successfully!");
      router.push(`/manage/courses/${courseId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to save quiz.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loader">Loading...</div>;

  return (
    <ProtectedRoute allowedRoles={["Admin", "Content Manager", "Instructor"]}>
      <div className="course-detail-container">
        <h1>{quizId ? "Edit Quiz" : "Create Quiz"}</h1>
        
        <form onSubmit={handleSave} className="card" style={{ gap: "2rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label>Quiz Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required
              style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", background: "rgba(15, 23, 42, 0.6)", color: "white" }}
            />
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>Questions</h3>
              <button type="button" onClick={addQuestion} className="secondary-button" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}>+ Add Question</button>
            </div>
            
            {questions.map((q, qIdx) => (
              <div key={qIdx} style={{ background: "rgba(0,0,0,0.2)", padding: "1.5rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", position: "relative" }}>
                <button type="button" onClick={() => removeQuestion(qIdx)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", color: "var(--error-color)", cursor: "pointer", fontSize: "1.2rem" }}>&times;</button>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                  <label>Question Text</label>
                  <input 
                    type="text" 
                    value={q.text} 
                    onChange={e => updateQuestion(qIdx, "text", e.target.value)} 
                    required
                    style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", background: "rgba(15, 23, 42, 0.6)", color: "white" }}
                  />
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label>Options & Correct Answer</label>
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input 
                        type="radio" 
                        name={`correct-${qIdx}`} 
                        checked={q.correctOptionIndex === oIdx} 
                        onChange={() => updateQuestion(qIdx, "correct", oIdx)} 
                      />
                      <input 
                        type="text" 
                        value={opt} 
                        onChange={e => updateQuestion(qIdx, "option", e.target.value, oIdx)} 
                        placeholder={`Option ${oIdx + 1}`}
                        required
                        style={{ flex: 1, padding: "0.5rem", borderRadius: "0.25rem", border: "1px solid var(--border-color)", background: "transparent", color: "white" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {questions.length === 0 && <p style={{ color: "#94a3b8", fontStyle: "italic" }}>No questions added yet. Click "+ Add Question" to start.</p>}
          </div>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button type="button" onClick={() => router.back()} className="secondary-button">Cancel</button>
            <button type="submit" disabled={saving} className="primary-button">
              {saving ? "Saving..." : "Save Quiz"}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
