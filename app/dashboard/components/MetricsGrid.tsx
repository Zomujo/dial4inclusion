"use client";

interface MetricItem {
  label: string;
  value: number | string;
  change: string;
  trend: "up" | "down";
  color: "blue" | "green" | "purple" | "red";
}

interface MetricsGridProps {
  metrics: MetricItem[];
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{metric.label}</p>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            </div>
            <div
              className={`rounded-full p-3 ${
                metric.color === "blue"
                  ? "bg-blue-100"
                  : metric.color === "green"
                  ? "bg-green-100"
                  : metric.color === "purple"
                  ? "bg-purple-100"
                  : "bg-red-100"
              }`}
            >
              <div
                className={`h-6 w-6 ${
                  metric.color === "blue"
                    ? "bg-blue-500"
                    : metric.color === "green"
                    ? "bg-green-500"
                    : metric.color === "purple"
                    ? "bg-purple-500"
                    : "bg-red-500"
                } rounded`}
              ></div>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span
              className={`text-sm font-semibold ${
                metric.color === "green"
                  ? "text-green-600"
                  : metric.color === "red"
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {metric.change}
            </span>
            <span className="ml-2 text-sm text-gray-500">vs last week</span>
          </div>
        </div>
      ))}
    </div>
  );
}

