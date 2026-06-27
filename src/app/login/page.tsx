"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Lock, User, ShieldCheck, Loader2, ChevronRight } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (res?.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("Unauthorized Access: Credentials Mismatch");
      setLoading(false);
    }
  };

  // Animation variants for staggered entrance
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6, 
        staggerChildren: 0.1, 
        // Using a cubic-bezier array instead of a string fixes the type error 
        // and provides a much smoother, high-end animation feel
        ease: [0.22, 1, 0.36, 1] 
      } 
    }
  };

  
const itemVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md relative z-10"
      >
        <div className="glass p-8 md:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
          
          {/* Animated Header Profile Section */}
          <motion.div variants={itemVariants} className="text-center mb-10">
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="w-20 h-20 bg-primary/10 border-2 border-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner"
            >
              <ShieldCheck className="w-10 h-10 text-primary" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground uppercase italic leading-none">
              Access <span className="text-primary not-italic">Gate</span>
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-3">
              Admin Control Unit
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Identity Field */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Identity Signature</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary text-muted-foreground">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-secondary/30 dark:bg-slate-950/50 backdrop-blur-md border border-border rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all outline-none text-foreground placeholder:text-muted-foreground/50"
                  placeholder="admin_id"
                />
              </div>
            </motion.div>

            {/* Security Key Field */}
            <motion.div variants={itemVariants} className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Security Hash</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-primary text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-secondary/30 dark:bg-slate-950/50 backdrop-blur-md border border-border rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all outline-none text-foreground placeholder:text-muted-foreground/50"
                  placeholder="••••••••"
                />
              </div>
            </motion.div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-destructive/10 border border-destructive/20 rounded-xl p-3"
              >
                <p className="text-[11px] font-bold text-destructive text-center uppercase tracking-wider">{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-black py-5 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="tracking-widest uppercase">Authenticate</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>
        </div>
        
        <motion.div 
          variants={itemVariants}
          className="text-center mt-10 space-y-2"
        >
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">
            NIT Srinagar • Internal Secure Protocol
          </p>
          <div className="flex justify-center gap-4">
            <div className="h-1 w-8 bg-primary/20 rounded-full" />
            <div className="h-1 w-1 bg-primary/20 rounded-full" />
            <div className="h-1 w-1 bg-primary/20 rounded-full" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}