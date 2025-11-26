import * as React from "react";

export type PhaseStatus = "completed" | "in_progress" | "blocked" | "pending";

interface StatusCardProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: PhaseStatus;
}

export function StatusCard({ status, className, style, ...props }: StatusCardProps) {
  const getStatusStyles = (status?: PhaseStatus) => {
    switch (status) {
      case "completed":
        return {
          border: "2px solid #22c55e",
        };
      case "in_progress":
        return {
          border: "2px solid #3b82f6",
        };
      case "blocked":
        return {
          border: "2px solid #f97316",
        };
      case "pending":
      default:
        return {
          border: "2px solid #374151",
        };
    }
  };

  const statusStyles = getStatusStyles(status);

  return (
    <div
      className={className}
      style={{ ...statusStyles, ...style }}
      {...props}
    />
  );
}
