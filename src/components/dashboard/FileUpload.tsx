'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, Loader2, AlertTriangle, X } from 'lucide-react';

export default function FileUpload({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const currentYear = new Date().getFullYear();
  const batches = [
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`,
  ];
  
  const [batch, setBatch] = useState(batches[1]);
  const [status, setStatus] = useState<'idle' | 'previewing' | 'confirm' | 'uploading' | 'success' | 'warning' | 'error'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewSummary, setPreviewSummary] = useState<{
    processed: number;
    totalCandidates: number;
    uniqueCandidates: number;
    willInsert: number;
    willUpdate: number;
  } | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [processedCount, setProcessedCount] = useState(0);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setStatus('previewing');
    setErrorMessage(null);
    setWarnings([]);
    setPreviewSummary(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('batch', batch);
    formData.append('previewOnly', 'true');

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMessage(data?.error || 'Could not analyze this file. Please verify the sheet and try again.');
        setStatus('error');
        return;
      }

      setPreviewSummary({
        processed: data.processed || 0,
        totalCandidates: data.totalCandidates || 0,
        uniqueCandidates: data.uniqueCandidates || 0,
        willInsert: data.willInsert || 0,
        willUpdate: data.willUpdate || 0,
      });
      setWarnings(data.warnings || []);
      setStatus('confirm');
    } catch {
      setErrorMessage('Network error while preparing preview. Please try again.');
      setStatus('error');
    }
  };

  const uploadConfirmed = async () => {
    if (!selectedFile) {
      setErrorMessage('Please choose a file before upload.');
      setStatus('error');
      return;
    }

    setStatus('uploading');
    setErrorMessage(null);
    setWarnings([]);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('batch', batch);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      
      if (res.ok) {
        setProcessedCount(data.processed || 0);

        if (data.warnings && data.warnings.length > 0) {
          setWarnings(data.warnings);
          setStatus('warning');
          onUploadSuccess();
        } else {
          setStatus('success');
          onUploadSuccess();
          setTimeout(() => {
            setStatus('idle');
            setSelectedFile(null);
            setPreviewSummary(null);
          }, 3000);
        }
      } else {
        setErrorMessage(data?.error || 'Upload failed. Please verify the file and retry.');
        setStatus('error');
      }
    } catch {
      setErrorMessage('Network error while uploading. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Batch Selection UI */}
      {(status === 'idle' || status === 'error' || status === 'confirm') && (
        <select 
          className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest outline-none focus:border-indigo-500/50"
          value={batch}
          onChange={(e) => setBatch(e.target.value)}
          disabled={status === 'confirm'}
        >
          {batches.map((b) => (
            <option key={b} value={b}>{b} Batch</option>
          ))}
        </select>
      )}

      <motion.div 
        whileHover={status === 'idle' ? { scale: 1.01 } : {}}
        className={`relative border-2 border-dashed rounded-2xl p-8 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden transition-colors duration-500
          ${status === 'warning' ? 'border-amber-400/60 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-900/20' : 'border-indigo-300 dark:border-indigo-500/30 bg-slate-50 dark:bg-slate-900/50'}
          ${status === 'idle' ? 'cursor-pointer' : ''}
        `}
      >
        {status === 'idle' && (
          <input type="file" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
        )}
        
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
              <UploadCloud className="w-12 h-12 text-indigo-400 mb-4" />
              <p className="text-slate-700 dark:text-slate-300 font-medium text-lg">Drop Updated Excel Here</p>
              <p className="text-slate-500 dark:text-slate-500 text-sm">Syncs automatically with MongoDB</p>
            </motion.div>
          )}
          {status === 'previewing' && (
            <motion.div key="previewing" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
              <p className="text-indigo-600 dark:text-indigo-300 animate-pulse font-medium">Analyzing Upload Impact...</p>
              <p className="text-slate-500 text-xs mt-2">Preparing insert/update preview</p>
            </motion.div>
          )}
          {status === 'confirm' && previewSummary && (
            <motion.div key="confirm" initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full space-y-4">
              <div className="text-center">
                <p className="text-indigo-700 dark:text-indigo-200 font-bold text-base">Confirm Bulk Upload</p>
                <p className="text-slate-400 text-xs mt-1">
                  {selectedFile?.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-700/80 dark:text-emerald-300/80">Will Add</p>
                  <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{previewSummary.willInsert}</p>
                </div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-amber-700/80 dark:text-amber-300/80">Will Update</p>
                  <p className="text-xl font-black text-amber-700 dark:text-amber-300">{previewSummary.willUpdate}</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 text-center">
                Parsed {previewSummary.processed} rows. Unique target records: {previewSummary.uniqueCandidates}.
              </p>

              {warnings.length > 0 && (
                <div className="w-full max-h-28 overflow-y-auto custom-scrollbar bg-amber-50 dark:bg-black/20 rounded-lg p-3 border border-amber-500/20">
                  <p className="text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-2">Warnings</p>
                  <ul className="text-xs text-amber-700/90 dark:text-amber-200/80 space-y-1 text-left">
                    {warnings.slice(0, 5).map((warn, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {warn}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setStatus('idle');
                    setSelectedFile(null);
                    setPreviewSummary(null);
                    setWarnings([]);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={uploadConfirmed}
                  className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold transition-colors"
                >
                  Confirm & Upload
                </button>
              </div>
            </motion.div>
          )}
          {status === 'uploading' && (
          <motion.div key="loading" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
            <p className="text-indigo-600 dark:text-indigo-300 animate-pulse font-medium">Processing File...</p>
            <p className="text-slate-500 text-xs mt-2">Checking data integrity</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div key="success" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-12 h-12 mb-4" />
            <p className="font-bold text-lg">Database Updated!</p>
            <p className="text-emerald-600/70 dark:text-emerald-500/70 text-sm">{processedCount} records synced perfectly.</p>
          </motion.div>
        )}

        {status === 'warning' && (
          <motion.div key="warning" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center w-full">
            <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
            <p className="font-bold text-amber-600 dark:text-amber-400 text-lg">Partial Success</p>
            <p className="text-amber-700/70 dark:text-amber-500/70 text-sm text-center mb-4">
              {processedCount} records processed, but some need manual review.
            </p>
            
            {/* Scrollable Warnings List */}
            <div className="w-full max-h-32 overflow-y-auto custom-scrollbar bg-amber-50 dark:bg-black/20 rounded-lg p-3 border border-amber-500/20 mb-4">
              <ul className="text-xs text-amber-700/90 dark:text-amber-200/80 space-y-1 text-left">
                {warnings.map((warn, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    {warn}
                  </li>
                ))}
              </ul>
            </div>

            <button 
              onClick={() => {
                setStatus('idle');
                setSelectedFile(null);
                setPreviewSummary(null);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 rounded-xl text-sm font-semibold transition-colors"
            >
              <X className="w-4 h-4" /> Acknowledge
            </button>
          </motion.div>
        )}
        {status === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center w-full">
            <AlertTriangle className="w-10 h-10 text-rose-400 mb-3" />
            <p className="font-bold text-rose-600 dark:text-rose-300 text-lg">Upload Failed</p>
            <p className="text-rose-700/80 dark:text-rose-200/80 text-sm text-center mb-4">{errorMessage || 'Something went wrong while uploading.'}</p>
            <button
              type="button"
              onClick={() => {
                setStatus('idle');
                setSelectedFile(null);
                setPreviewSummary(null);
                setWarnings([]);
                setErrorMessage(null);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-200 rounded-xl text-sm font-semibold transition-colors"
            >
              <X className="w-4 h-4" /> Try Again
            </button>
          </motion.div>
        )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}