"use client";
import { Download } from "lucide-react";

export default function DownloadAllData() {
  const handleDownload = async () => {
    const res = await fetch("/api/export");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "All_Placements.xlsx";
    a.click();
  };

  return (
    <button 
      onClick={handleDownload}
      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all"
    >
      <Download className="w-4 h-4" /> Download Full Workbook
    </button>
  );
}