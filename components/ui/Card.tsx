import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}) {
  return (
    <Tag
      className={
        "bg-white border border-swiss-line shadow-card rounded-sm " +
        "transition-shadow hover:shadow-pop " +
        className
      }
    >
      {children}
    </Tag>
  );
}

export function Section({
  title,
  children,
  right,
}: {
  title?: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <section className="py-10">
      {(title || right) && (
        <div className="flex items-end justify-between mb-6 gap-4">
          {title ? (
            <h2 className="font-display text-[28px] leading-tight tracking-tight">
              {title}
            </h2>
          ) : (
            <span />
          )}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
