"use client";
import { useState } from "react";

export default function CompanyLogo({ src, name }: { src: string | null | undefined; name: string }) {
  const [error, setError] = useState(false);

  // 1. Validation: If src is empty, null, or has errored, show the fallback UI immediately
  const showFallback = !src || src.trim() === "" || error;

  return (
    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
      {!showFallback ? (
        <img
          // 2. Optimization: Ensure we never pass an empty string to src
          src={src as string}
          alt={`${name} logo`}
          className="w-full h-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-110"
          onError={() => setError(true)}
        />
      ) : (
        // 3. High-Graphics Fallback: A nice gradient with the first letter
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
          <span className="text-xs font-black text-indigo-400 uppercase">
            {name?.charAt(0) || "C"}
          </span>
        </div>
      )}
    </div>
  );
}