"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const StripePaymentGatewway = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<number>(5000); // cents

  useEffect(() => {
    (async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1000";
        const me = await axios.get(`${apiBase}/api/auth/me`, { withCredentials: true });
        setUser(me.data.user);
      } catch (err) {
        setUser(null);
      }
      // parse amount from query string on load
      const params = new URLSearchParams(window.location.search);
      const amt = params.get("amount");
      if (amt) {
        const parsed = parseInt(amt, 10);
        if (!isNaN(parsed)) setAmount(parsed);
      }
    })();
  }, []);

  const handleCheckout = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1000";
      // parse amount from query or default to 5000
      const params = new URLSearchParams(window.location.search);
      const amtParam = params.get("amount");
      const body: any = {};
      if (amtParam) {
        const parsed = parseInt(amtParam, 10);
        if (!isNaN(parsed)) body.amount = parsed;
      }
      const resp = await axios.post(
        `${apiBase}/api/stripe/create-checkout-session`,
        body,
        { withCredentials: true }
      );
      if (resp.data.url) {
        window.location.href = resp.data.url;
      }
    } catch (err) {
      console.error("checkout error", err);
      alert("Failed to start checkout, see console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Premium Access
        </h1>
        <p className="text-gray-600 dark:text-gray-300">One-time payment of ${(amount/100).toFixed(2)} to continue.</p>

        {user ? (
          user.isPremium ? (
            <div className="mt-6 text-green-600 dark:text-green-400 font-medium">
              You already have premium access.
            </div>
          ) : (
            <div className="mt-6">
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="px-6 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-50"
              >
                {loading ? "Processing..." : "Checkout"}
              </button>
            </div>
          )
        ) : (
          <div className="mt-6">
            <p className="text-sm text-gray-500">Please <a href="/login" className="text-indigo-600">login</a> to purchase.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StripePaymentGatewway;