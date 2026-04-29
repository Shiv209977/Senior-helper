import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-[#21473e] text-white hover:bg-[#17352e]",
  secondary: "bg-[#f2c66d] text-[#17211d] hover:bg-[#e9b84e]",
  danger: "bg-[#b6422c] text-white hover:bg-[#933322]",
  ghost: "bg-transparent text-[#21473e] hover:bg-[#e9dfcf]",
};

export function Button({ className, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-12 items-center justify-center rounded-2xl px-5 py-3 text-base font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

