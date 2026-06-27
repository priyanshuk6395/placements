"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function TrafficTracker() {
  const pathname = usePathname();
  const startTime = useRef<number>(0);

  useEffect(() => {
    startTime.current = Date.now();

    const logSessionDuration = () => {
      const currentDuration = Math.round((Date.now() - startTime.current) / 1000);
      if (currentDuration > 2) {
        // sendBeacon is asynchronous and non-blocking during page unloads
        navigator.sendBeacon(
          "/api/traffic",
          JSON.stringify({ path: pathname, duration: currentDuration })
        );
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        logSessionDuration();
      } else {
        startTime.current = Date.now();
      }
    };

    window.addEventListener("beforeunload", logSessionDuration);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      logSessionDuration();
      window.removeEventListener("beforeunload", logSessionDuration);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname]);

  return null; // Invisible component
}