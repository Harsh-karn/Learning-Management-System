"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

export default function EditBlogPost() {
  const params = useParams();
  const id = params.id as string;
  const isNew = id === "new";
  const router = useRouter();
  const { jwt, user } = useAuth();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew && jwt) {
      const fetchPost = async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/blog-posts/${id}?publicationState=preview`, {
            headers: { Authorization: `Bearer ${jwt}` }
          });
          const data = await res.json();
          if (data.data) {
            const p = data.data;
            setTitle(p.title || "");
            setBody(p.body || "");
            setCoverImageUrl(p.coverImageUrl || "");
            setPublishedAt(p.publishedAt);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchPost();
    }
  }, [id, isNew, jwt]);

  const handleSave = async (e: React.FormEvent, publish: boolean = false) => {
    e.preventDefault();
    setSaving(true);
    
    // In Strapi, setting publishedAt to null makes it a draft. 
    // Setting it to a date publishes it. If creating and we want draft, we might not send it, or send null.
    // However, Strapi automatically handles drafts if we just save it. To publish, we need to provide a publishedAt date, or just let Strapi handle standard publication if it exposes a publish endpoint. 
    // For simplicity in Strapi v4/v5 API: send `publishedAt: null` to unpublish/draft, and `publishedAt: new Date().toISOString()` to publish.
    
    let newPublishedAt = publishedAt;
    if (publish && !publishedAt) {
      newPublishedAt = new Date().toISOString();
    } else if (!publish && publishedAt) {
      newPublishedAt = null;
    }

    const payload = {
      data: {
        title,
        body,
        coverImageUrl,
        publishedAt: newPublishedAt,
        author: user?.id
      }
    };

    try {
      const url = isNew 
        ? `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/blog-posts`
        : `${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/blog-posts/${id}`;
        
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Failed to save");
      
      router.push("/manage/blog");
    } catch (err) {
      console.error(err);
      alert("Error saving blog post");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loader">Loading...</div>;

  return (
    <ProtectedRoute allowedRoles={["Admin", "Content Manager"]}>
      <div className="course-detail-container" style={{ maxWidth: "800px" }}>
        <h1>{isNew ? "Create Blog Post" : "Edit Blog Post"}</h1>
        
        <form className="card" style={{ gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label>Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required
              style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", background: "rgba(15, 23, 42, 0.6)", color: "white" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label>Cover Image URL (optional)</label>
            <input 
              type="url" 
              value={coverImageUrl} 
              onChange={e => setCoverImageUrl(e.target.value)} 
              style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", background: "rgba(15, 23, 42, 0.6)", color: "white" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label>Body (HTML / Text)</label>
            <textarea 
              value={body} 
              onChange={e => setBody(e.target.value)} 
              required
              rows={15}
              style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)", background: "rgba(15, 23, 42, 0.6)", color: "white", resize: "vertical", fontFamily: "monospace" }}
            />
          </div>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button type="button" onClick={() => router.back()} className="secondary-button" disabled={saving}>Cancel</button>
            <button 
              type="button" 
              onClick={(e) => handleSave(e, false)} 
              disabled={saving} 
              className="secondary-button"
            >
              Save as Draft
            </button>
            <button 
              type="button" 
              onClick={(e) => handleSave(e, true)} 
              disabled={saving} 
              className="primary-button"
            >
              {publishedAt ? "Update Published Post" : "Publish Now"}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
