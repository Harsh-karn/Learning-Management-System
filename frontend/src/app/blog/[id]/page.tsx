"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

type BlogPost = {
  id: number;
  title: string;
  body: string;
  coverImageUrl?: string;
  author?: { username: string };
  publishedAt?: string;
};

export default function BlogDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/blog-posts/${id}?populate=author`);
        const data = await res.json();
        
        if (data.data) {
          const p = data.data;
          setPost({
            id: p.documentId || p.id,
            title: p.title,
            body: p.body,
            coverImageUrl: p.coverImageUrl,
            author: p.author,
            publishedAt: p.publishedAt
          });
        }
      } catch (err) {
        console.error("Failed to fetch blog post:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id]);

  if (loading) return <div className="loader">Loading...</div>;
  if (!post) return <div className="container"><h2>Blog post not found.</h2></div>;

  return (
    <div className="course-detail-container" style={{ maxWidth: "800px" }}>
      <button onClick={() => router.push('/blog')} className="text-button" style={{ marginBottom: "1rem" }}>&larr; Back to Blog</button>
      
      {post.coverImageUrl && (
        <img 
          src={post.coverImageUrl} 
          alt="Cover" 
          style={{ width: "100%", maxHeight: "400px", objectFit: "cover", borderRadius: "1rem", marginBottom: "2rem" }} 
        />
      )}
      
      <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>{post.title}</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
        By {post.author?.username || "Unknown"} &bull; {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "Draft"}
      </p>
      
      <div className="card" style={{ background: "transparent", border: "none", padding: 0 }}>
        {/* Render markdown/richtext basic handling */}
        <div dangerouslySetInnerHTML={{ __html: post.body || "" }} style={{ lineHeight: "1.8", fontSize: "1.1rem" }} />
      </div>
    </div>
  );
}
