"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function SuccessPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1000";
        const resp = await axios.get(`${apiBase}/api/stripe/session/${sessionId}`, {
          withCredentials: true,
        });
        setSession(resp.data.session);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Payment Success
        </h1>
        {loading ? (
          <p>Loading session...</p>
        ) : (
          <>
            <p className="text-gray-600 dark:text-gray-300">Thank you for your purchase! Your account has been upgraded.</p>
            <button
              className="mt-6 px-6 py-2 rounded-md bg-indigo-600 text-white"
              onClick={() => router.push('/')}
            >
              Go to dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
