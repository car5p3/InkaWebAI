"use client";

import { useRouter } from "next/navigation";

export default function CancelPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Payment Cancelled
        </h1>
        <p className="text-gray-600 dark:text-gray-300">Your payment was not completed. You can try again anytime.</p>
        <button
          className="mt-6 px-6 py-2 rounded-md bg-indigo-600 text-white"
          onClick={() => router.push('/stripe')}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
