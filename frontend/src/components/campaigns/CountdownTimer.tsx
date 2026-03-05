"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { timeRemaining } from "@/lib/utils";

interface CountdownTimerProps {
  deadline: number;
}

export function CountdownTimer({ deadline }: CountdownTimerProps) {
  const [display, setDisplay] = useState(timeRemaining(deadline));

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplay(timeRemaining(deadline));
    }, 30_000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <span className="flex items-center gap-1.5 text-sm text-[#0077b6]">
      <Clock className="h-4 w-4" />
      {display}
    </span>
  );
}
