"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

type BlogPost = {
  id: number;
  title: string;
  publishedAt?: string;
  author?: { username: string };
};

export default function ManageBlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { jwt } = useAuth();

  const fetchPosts = async () => {
    try {
      // publicationState=preview allows fetching both drafts and published content if authenticated
      const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/blog-posts?publicationState=preview&populate=author`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const data = await res.json();
      
      if (data.data) {
        setPosts(data.data.map((p: any) => ({
          id: p.documentId || p.id,
          title: p.title,
          publishedAt: p.publishedAt,
          author: p.author
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jwt) fetchPosts();
  }, [jwt]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/blog-posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwt}` }
      });
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert("Failed to delete post");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["Admin", "Content Manager"]}>
      <div className="course-detail-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h1>Manage Blog Posts</h1>
          <button onClick={() => router.push("/manage/blog/new")} className="primary-button">
            + Create New Post
          </button>
        </div>

        {loading ? (
          <div className="loader">Loading...</div>
        ) : (
          <div className="card">
            {posts.length === 0 ? (
              <p>No blog posts found.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                    <th style={{ padding: "1rem" }}>Title</th>
                    <th style={{ padding: "1rem" }}>Author</th>
                    <th style={{ padding: "1rem" }}>Status</th>
                    <th style={{ padding: "1rem", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map(post => (
                    <tr key={post.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "1rem", fontWeight: "500" }}>{post.title}</td>
                      <td style={{ padding: "1rem", color: "var(--text-muted)" }}>{post.author?.username || "Unknown"}</td>
                      <td style={{ padding: "1rem" }}>
                        {post.publishedAt ? (
                          <span style={{ color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.875rem" }}>Published</span>
                        ) : (
                          <span style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.875rem" }}>Draft</span>
                        )}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <button onClick={() => router.push(`/manage/blog/${post.id}`)} className="text-button" style={{ marginRight: "1rem" }}>Edit</button>
                        <button onClick={() => handleDelete(post.id)} className="text-button" style={{ color: "var(--error-color)" }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
