"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1000";
        const resp = await axios.get(`${apiBase}/api/auth/me`, { withCredentials: true });
        setUser(resp.data.user);
      } catch (err) {
        console.error(err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-8">Loading…</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">{user.username || user.email}</p>

        <section className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Orders</h2>
          {user.orders && user.orders.length ? (
            <ul className="mt-2 space-y-2">
              {user.orders.map((o: any, idx: number) => (
                <li key={idx} className="p-3 border rounded-md bg-gray-50 dark:bg-gray-700">
                  <div>Session: {o.sessionId}</div>
                  <div>Amount: ${(o.amount/100).toFixed(2)}</div>
                  <div className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 mt-2">No orders yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}