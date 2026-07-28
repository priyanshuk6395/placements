"use client";
import { useState } from "react";
import { CheckCircle2, Loader2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EntryDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
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

  const resetState = () => {
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  // Convert native <input type="date"> value (YYYY-MM-DD) to the DD-MM-YYYY
  // format required by the placement schema.
  const toSchemaDate = (isoDate: string) => {
    if (!isoDate) return "TBD";
    const [year, month, day] = isoDate.split("-");
    if (!year || !month || !day) return "TBD";
    return `${day}-${month}-${year}`;
  };

  // Ensure the website has a protocol so it passes z.string().url().
  const toSchemaUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await fetch("/api/placement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          website: toSchemaUrl(formData.website),
          date: toSchemaDate(formData.date),
          batchYear: parseInt(formData.batchYear.split("-")[1], 10),
          ctc: formData.offerType !== "Internship" ? Number(formData.ctc || 0) : 0,
          stipend: formData.offerType === "Internship" ? Number(formData.stipend || 0) : 0,
        }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        const detailMessages = Array.isArray(payload?.details)
          ? payload.details
              .map((d: any) => d?.message)
              .filter(Boolean)
              .join(" ")
          : "";
        const message =
          detailMessages ||
          payload?.error ||
          "Could not save this entry. Please review the form and try again.";
        setSubmitError(message);
        return;
      }

      setSubmitSuccess("Record saved successfully.");
      router.refresh();
      setTimeout(() => {
        setIsOpen(false);
        resetState();
      }, 900);
    } catch {
      setSubmitError("Network error while saving. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          resetState();
          setIsOpen(true);
        }}
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
              <button type="button" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitError && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {submitSuccess}
              </div>
            )}

            {/* Batch Selection */}
            <div className="space-y-1">
              <label htmlFor="entry-batch" className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Batch</label>
              <select
                id="entry-batch"
                required
                className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800"
                onChange={(e) => setFormData({ ...formData, batchYear: e.target.value })}
                value={formData.batchYear}
                disabled={isSubmitting}
              >
                {batches.map((batch) => (
                  <option key={batch} value={batch}>{batch} Batch</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="entry-name" className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Name</label>
              <input id="entry-name" required placeholder="Student full name" className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} disabled={isSubmitting} />
            </div>

            <div className="space-y-1">
              <label htmlFor="entry-enrollment" className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Enrollment Number</label>
              <input id="entry-enrollment" required placeholder="e.g. 2021BCS001" className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800" value={formData.enrollmentNo} onChange={(e) => setFormData({ ...formData, enrollmentNo: e.target.value })} disabled={isSubmitting} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="entry-gender" className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Gender</label>
                <select id="entry-gender" className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} disabled={isSubmitting}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="entry-branch" className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Branch</label>
                <select id="entry-branch" className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800" value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })} disabled={isSubmitting}>
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
            </div>

            <div className="space-y-1">
              <label htmlFor="entry-company" className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Company</label>
              <input id="entry-company" required placeholder="Company name" className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} disabled={isSubmitting} />
            </div>

            <div className="space-y-1">
              <label htmlFor="entry-offer" className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Offer Type</label>
              <select id="entry-offer" required className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800" value={formData.offerType} onChange={(e) => setFormData({ ...formData, offerType: e.target.value })} disabled={isSubmitting}>
                <option value="Full-Time">Full-Time</option>
                <option value="Internship">Internship</option>
                <option value="Internship + PPO">Internship + PPO</option>
              </select>
            </div>

            {formData.offerType !== "Internship" ? (
              <div className="space-y-1">
                <label htmlFor="entry-ctc" className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">CTC (LPA)</label>
                <input id="entry-ctc" required type="number" step="0.01" min="0" placeholder="e.g. 14.5" className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800" value={formData.ctc} onChange={(e) => setFormData({ ...formData, ctc: e.target.value })} disabled={isSubmitting} />
              </div>
            ) : (
              <div className="space-y-1">
                <label htmlFor="entry-stipend" className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Monthly Stipend</label>
                <input id="entry-stipend" required type="number" min="0" placeholder="e.g. 50000" className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800" value={formData.stipend} onChange={(e) => setFormData({ ...formData, stipend: e.target.value })} disabled={isSubmitting} />
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="entry-website" className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Company Website</label>
              <input id="entry-website" required placeholder="https://company.com" className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} disabled={isSubmitting} />
            </div>

            <div className="space-y-1">
              <label htmlFor="entry-date" className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Offer Date</label>
              <input id="entry-date" required type="date" className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} disabled={isSubmitting} />
            </div>

            <div className="space-y-1">
              <label htmlFor="entry-linkedin" className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">LinkedIn (Optional)</label>
              <input id="entry-linkedin" placeholder="https://linkedin.com/in/username" className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800" value={formData.linkedin} onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} disabled={isSubmitting} />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white py-4 rounded-2xl font-bold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isSubmitting ? "Saving..." : "Save Record"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}