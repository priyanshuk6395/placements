"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoyalPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const visits = parseInt(localStorage.getItem('visitCount') || '0');
    // Threshold: User becomes "Loyal" after 5 visits
    if (visits >= 5 && !localStorage.getItem('isLoyal')) {
      setShow(true);
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = (e.target as any).elements[0].value;

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // SECURITY FIX: IP is now captured server-side from request headers
      // Client only sends name
      const response = await fetch("/api/visitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to record visitor");
      }

      localStorage.setItem('isLoyal', 'true');
      setShow(false);
    } catch (err: any) {
      console.error("Visitor recording error:", err);
      setError(err.message || "Failed to record visitor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed bottom-6 right-6 p-6 bg-indigo-600 text-white rounded-3xl shadow-2xl z-50 max-w-sm">
          <h4 className="font-black text-sm mb-2">You're a Regular!</h4>
          <p className="text-xs opacity-80 mb-4">Save your name for our visitor hall of fame.</p>
          {error && (
            <p className="text-xs bg-red-500 bg-opacity-20 border border-red-300 rounded p-2 mb-3">
              {error}
            </p>
          )}
          <form onSubmit={handleSave} className="flex gap-2">
            <input
              className="bg-white/20 p-2 rounded-lg text-sm flex-1"
              placeholder="Enter name..."
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}