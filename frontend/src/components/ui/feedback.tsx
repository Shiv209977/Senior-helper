import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[#17211d]">{title}</h1>
          <p className="mt-3 max-w-3xl text-xl font-semibold text-[#5b665f]">{subtitle}</p>
        </div>
        {action ? <div className="flex shrink-0 flex-wrap gap-3">{action}</div> : null}
      </div>
    </Card>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-[#c8bdac] bg-white/70 p-6">
      <p className="text-xl font-black text-[#17211d]">{title}</p>
      <p className="mt-2 text-lg font-semibold text-[#5b665f]">{message}</p>
    </div>
  );
}

export function StatusMessage({ message, tone = "info" }: { message: string; tone?: "info" | "success" | "error" }) {
  const tones = {
    info: "bg-[#e6f0ea] text-[#21473e]",
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
  };

  return <p className={cn("rounded-2xl p-3 text-base font-bold", tones[tone])}>{message}</p>;
}

export function LoadingState({ label = "Loading care data..." }: { label?: string }) {
  return <StatusMessage message={label} />;
}

export function ConfirmButton({
  confirmMessage,
  children,
  onConfirm,
  variant = "secondary",
}: {
  confirmMessage: string;
  children: ReactNode;
  onConfirm: () => void | Promise<void>;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  return (
    <Button
      type="button"
      variant={variant}
      onClick={() => {
        if (window.confirm(confirmMessage)) {
          void onConfirm();
        }
      }}
    >
      {children}
    </Button>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <CardTitle>{title}</CardTitle>
      {subtitle ? <p className="mt-2 text-lg font-semibold text-[#5b665f]">{subtitle}</p> : null}
    </div>
  );
}
