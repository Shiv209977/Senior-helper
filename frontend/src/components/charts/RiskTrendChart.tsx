import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { EmptyState } from "@/components/ui/feedback";
import type { AIRiskAssessment } from "@/lib/api";

type Props = {
  assessments: AIRiskAssessment[];
};

export function RiskTrendChart({ assessments }: Props) {
  if (assessments.length < 2) {
    return <EmptyState title="Not enough assessments" message="Run at least 2 risk checks to see score trends." />;
  }

  const data = [...assessments]
    .reverse()
    .slice(0, 20)
    .reverse()
    .map((a) => ({
      date: new Date(a.created_at).toLocaleDateString(),
      score: a.risk_score,
      category: a.risk_category,
    }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d8cebd" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#5b665f" }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#5b665f" }} />
          <Tooltip />
          <ReferenceLine y={75} stroke="#b65f3a" strokeDasharray="3 3" label={{ value: "Emergency", fontSize: 10, fill: "#b65f3a" }} />
          <ReferenceLine y={50} stroke="#f2c66d" strokeDasharray="3 3" label={{ value: "High", fontSize: 10, fill: "#f2c66d" }} />
          <Line type="monotone" dataKey="score" stroke="#21473e" name="Risk score" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
