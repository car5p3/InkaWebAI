"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow p-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to InkaWebAI</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Personal AI chats saved to your account. Create, continue, and manage your chat instances.</p>

        <div className="mt-8 flex justify-center gap-4">
          <Link href="/login" className="px-5 py-2 rounded-md bg-indigo-600 text-white">Login</Link>
          <Link href="/signup" className="px-5 py-2 rounded-md border">Sign up</Link>
        </div>

        {/* <div className="mt-6 text-sm text-gray-500">
          Or try a demo without logging in: <Link href="/chat" className="text-indigo-600">Open Chat</Link>
        </div> */}
      </div>
    </div>
  );
}
