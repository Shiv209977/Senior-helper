import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { EmptyState } from "@/components/ui/feedback";
import type { VitalSign } from "@/lib/api";

type Props = {
  vitals: VitalSign[];
};

export function VitalsChart({ vitals }: Props) {
  if (vitals.length < 2) {
    return <EmptyState title="Not enough data yet" message="Record at least 2 vitals entries to see trends." />;
  }

  const data = [...vitals]
    .reverse()
    .slice(0, 20)
    .reverse()
    .map((v) => ({
      date: new Date(v.recorded_at).toLocaleDateString(),
      oxygen: v.oxygen_level,
      temperature: v.temperature ? Number(v.temperature) : null,
      pain: v.pain_level,
    }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d8cebd" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#5b665f" }} />
          <YAxis tick={{ fontSize: 12, fill: "#5b665f" }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="oxygen" stroke="#21473e" name="Oxygen %" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="temperature" stroke="#b65f3a" name="Temp °C" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="pain" stroke="#f2c66d" name="Pain 0-10" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
