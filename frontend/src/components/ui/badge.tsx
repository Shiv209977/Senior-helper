import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex rounded-full bg-[#e6f0ea] px-3 py-1 text-sm font-bold text-[#21473e]", className)} {...props} />;
}

