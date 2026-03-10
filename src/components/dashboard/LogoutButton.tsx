"use client";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="ml-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all group"
      title="Secure Logout"
    >
      <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
    </button>
  );
}