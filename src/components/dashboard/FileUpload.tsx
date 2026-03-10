'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, Loader2, AlertTriangle, X } from 'lucide-react';

export default function FileUpload({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'warning'>('idle');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [processedCount, setProcessedCount] = useState(0);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('uploading');
    setWarnings([]); // Reset warnings on new upload
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      
      if (res.ok) {
        const data = await res.json();
        setProcessedCount(data.processed || 0);

        // Check if our API salvaged everything perfectly or caught errors
        if (data.warnings && data.warnings.length > 0) {
          setWarnings(data.warnings);
          setStatus('warning');
          onUploadSuccess(); // Still refresh the table for the successful rows
        } else {
          setStatus('success');
          onUploadSuccess();
          setTimeout(() => setStatus('idle'), 3000);
        }
      } else {
        // Fallback for 500 errors
        setStatus('idle');
        alert("Upload failed. Check server logs.");
      }
    } catch (err) {
      setStatus('idle');
      console.error("Fetch error", err);
    }
  };

  return (
    <motion.div 
      whileHover={status === 'idle' ? { scale: 1.01 } : {}}
      className={`relative border-2 border-dashed rounded-2xl p-8 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden transition-colors duration-500
        ${status === 'warning' ? 'border-amber-500/50 bg-amber-900/20' : 'border-indigo-500/30 bg-slate-900/50'}
        ${status === 'idle' ? 'cursor-pointer' : ''}
      `}
    >
      {/* Only allow clicking if idle */}
      {status === 'idle' && (
        <input type="file" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
      )}
      
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
            <UploadCloud className="w-12 h-12 text-indigo-400 mb-4" />
            <p className="text-slate-300 font-medium text-lg">Drop Updated Excel Here</p>
            <p className="text-slate-500 text-sm">Syncs automatically with MongoDB</p>
          </motion.div>
        )}

        {status === 'uploading' && (
          <motion.div key="loading" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
            <p className="text-indigo-300 animate-pulse font-medium">Processing File...</p>
            <p className="text-slate-500 text-xs mt-2">Checking data integrity</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div key="success" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-emerald-400">
            <CheckCircle2 className="w-12 h-12 mb-4" />
            <p className="font-bold text-lg">Database Updated!</p>
            <p className="text-emerald-500/70 text-sm">{processedCount} records synced perfectly.</p>
          </motion.div>
        )}

        {status === 'warning' && (
          <motion.div key="warning" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center w-full">
            <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
            <p className="font-bold text-amber-400 text-lg">Partial Success</p>
            <p className="text-amber-500/70 text-sm text-center mb-4">
              {processedCount} records processed, but some need manual review.
            </p>
            
            {/* Scrollable Warnings List */}
            <div className="w-full max-h-32 overflow-y-auto custom-scrollbar bg-black/20 rounded-lg p-3 border border-amber-500/20 mb-4">
              <ul className="text-xs text-amber-200/80 space-y-1 text-left">
                {warnings.map((warn, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {warn}
                  </li>
                ))}
              </ul>
            </div>

            <button 
              onClick={() => setStatus('idle')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-sm font-semibold transition-colors"
            >
              <X className="w-4 h-4" /> Acknowledge
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}