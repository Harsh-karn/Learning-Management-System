"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const endpoint = isLogin ? "/api/auth/local" : "/api/auth/local/register";
      const payload = isLogin
        ? { identifier, password }
        : { username, email, password };

      const res = await fetch(`http://localhost:1337${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Authentication failed");
      }

      // Strapi doesn't return role details by default in auth response.
      // We'll need to fetch user details to get the role.
      const userRes = await fetch(`http://localhost:1337/api/users/me?populate=role`, {
        headers: {
          Authorization: `Bearer ${data.jwt}`,
        },
      });

      const userData = await userRes.json();
      
      login(data.jwt, {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role ? { id: userData.role.id, name: userData.role.name } : undefined,
      });

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <h1>{isLogin ? "Login" : "Sign Up"} to LMS</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        {!isLogin && (
          <>
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </>
        )}
        {isLogin && (
          <>
            <label>Email or Username</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </>
        )}
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        {error && <p className="error">{error}</p>}
        
        <button type="submit">{isLogin ? "Login" : "Sign Up"}</button>
      </form>
      
      <p>
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button onClick={() => setIsLogin(!isLogin)} className="link-button">
          {isLogin ? "Sign Up" : "Login"}
        </button>
      </p>
    </div>
  );
}
