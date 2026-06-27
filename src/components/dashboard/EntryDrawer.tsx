"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EntryDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Dynamic Batch Calculation
  const currentYear = new Date().getFullYear();
  const batches = [
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`,
  ];

  const [formData, setFormData] = useState({
    name: "",
    enrollmentNo: "",
    gender: "Male",
    branch: "CSE",
    company: "",
    offerType: "Full-Time",
    ctc: "",
    stipend: "",
    website: "",
    date: new Date().toISOString().split("T")[0],
    linkedin: "",
    batchYear: batches[1], // Default to current-next
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/placement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        // Convert batchYear to number if your schema requires, or keep as string
        batchYear: parseInt(formData.batchYear.split('-')[1]), 
        ctc: formData.offerType !== "Internship" ? parseFloat(formData.ctc) : 0,
        stipend: formData.offerType === "Internship" ? parseFloat(formData.stipend) : 0,
      }),
    });
    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg"
      >
        <Plus className="w-4 h-4" /> Add Record
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 p-8 rounded-3xl w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-lg">New Placement Entry</h2>
              <button type="button" onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Batch Selection */}
            <select
              required
              className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800"
              onChange={(e) => setFormData({ ...formData, batchYear: e.target.value })}
              value={formData.batchYear}
            >
              {batches.map((batch) => (
                <option key={batch} value={batch}>{batch} Batch</option>
              ))}
            </select>

            <input required placeholder="Name" className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800" onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <input required placeholder="Enrollment Number" className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800" onChange={(e) => setFormData({ ...formData, enrollmentNo: e.target.value })} />

            <div className="grid grid-cols-2 gap-4">
              <select className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800" onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <select className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800" onChange={(e) => setFormData({ ...formData, branch: e.target.value })}>
                <option value="CSE">Computer Science (CSE)</option>
                <option value="IT">Information Technology (IT)</option>
                <option value="ECE">Electronics (ECE)</option>
                <option value="ELE">Electrical (ELE)</option>
                <option value="Mech">Mechanical</option>
                <option value="Civ">Civil</option>
                <option value="Chem">Chemical</option>
                <option value="Mme">Metallurgy</option>
              </select>
            </div>

            <input required placeholder="Company" className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800" onChange={(e) => setFormData({ ...formData, company: e.target.value })} />

            <select required className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800" onChange={(e) => setFormData({ ...formData, offerType: e.target.value })}>
              <option value="Full-Time">Full-Time</option>
              <option value="Internship">Internship</option>
              <option value="Internship + PPO">Internship + PPO</option>
            </select>

            {formData.offerType !== "Internship" ? (
              <input required type="number" placeholder="CTC (LPA)" className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800" onChange={(e) => setFormData({ ...formData, ctc: e.target.value })} />
            ) : (
              <input required type="number" placeholder="Stipend" className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800" onChange={(e) => setFormData({ ...formData, stipend: e.target.value })} />
            )}

            <input required placeholder="Company Website" className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800" onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
            <input required type="date" className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800" onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            <input placeholder="Student LinkedIn Id" className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800" onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} />

            <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-bold">Save Record</button>
          </form>
        </div>
      )}
    </>
  );
}