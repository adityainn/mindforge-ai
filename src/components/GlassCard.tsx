import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  hoverable?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  active = false,
  hoverable = true,
  className = "",
  style,
  ...props
}) => {
  return (
    <div
      className={`glassCard ${active ? "glassCardActive" : ""} ${className}`}
      style={{
        cursor: hoverable ? "pointer" : "default",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
