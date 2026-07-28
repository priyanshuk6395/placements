"use client";

import { motion, useMotionValue, useSpring, useTransform, animate, useMotionValueEvent } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}

export default function AnimatedNumber({
  value,
  format,
  duration = 0.9,
}: AnimatedNumberProps) {
  const formatter = useMemo(
    () => format ?? ((n: number) => Math.round(n).toLocaleString()),
    [format],
  );
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, {
    stiffness: 140,
    damping: 24,
    mass: 0.9,
  });
  const transformed = useTransform(springValue, (latest) => formatter(latest));
  const [display, setDisplay] = useState(() => formatter(value));

  useMotionValueEvent(transformed, "change", (latest) => {
    setDisplay(latest);
  });

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: "easeOut",
    });

    return () => controls.stop();
  }, [duration, motionValue, value]);

  return <motion.span>{display}</motion.span>;
}
