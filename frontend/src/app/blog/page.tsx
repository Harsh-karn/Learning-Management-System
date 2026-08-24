"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type BlogPost = {
  id: number;
  title: string;
  coverImageUrl?: string;
  author?: { username: string };
  publishedAt?: string;
};

export default function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { jwt, user } = useAuth(); // Can be null for public

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // By default Strapi v5 filters out unpublished items (drafts) automatically for standard APIs
        // unless you pass publicationState=preview and are authenticated with proper permissions.
        const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/blog-posts?populate=author`, {
          headers: jwt ? { Authorization: `Bearer ${jwt}` } : {}
        });
        const data = await res.json();
        if (data.data) {
          const parsed = data.data.map((p: any) => ({
            id: p.documentId || p.id,
            title: p.title,
            coverImageUrl: p.coverImageUrl,
            author: p.author,
            publishedAt: p.publishedAt
          }));
          setPosts(parsed);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [jwt]);

  const canManage = user?.role?.name === "Admin" || user?.role?.name === "Content Manager";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 className="page-title">Blog</h1>
        {canManage && (
          <button onClick={() => router.push("/manage/blog")} className="secondary-button">
            Manage Blog Posts
          </button>
        )}
      </div>

      {loading ? (
        <div className="loader">Loading...</div>
      ) : (
        <div className="card-grid">
          {posts.length === 0 ? (
            <p>No blog posts found.</p>
          ) : (
            posts.map(post => (
              <div key={post.id} className="card course-card" onClick={() => router.push(`/blog/${post.id}`)} style={{ cursor: "pointer" }}>
                {post.coverImageUrl && (
                  <img src={post.coverImageUrl} alt="Cover" style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "0.5rem", marginBottom: "1rem" }} />
                )}
                <h3>{post.title}</h3>
                <small className="instructor-text">By {post.author?.username || "Unknown"}</small>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
