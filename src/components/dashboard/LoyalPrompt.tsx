"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoyalPrompt() {
  const [show, setShow] = useState(false);

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
  
  await fetch("/api/visitor", { 
    method: "POST", 
    body: JSON.stringify({ name }) 
  });
  
  localStorage.setItem('isLoyal', 'true');
  setShow(false);
};

  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed bottom-6 right-6 p-6 bg-indigo-600 text-white rounded-3xl shadow-2xl z-50">
          <h4 className="font-black text-sm mb-2">You're a Regular!</h4>
          <p className="text-xs opacity-80 mb-4">Save your name for our visitor hall of fame.</p>
          <form onSubmit={handleSave} className="flex gap-2">
            <input className="bg-white/20 p-2 rounded-lg text-sm" placeholder="Enter name..." />
            <button type="submit" className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold">Save</button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}