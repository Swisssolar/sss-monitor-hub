import { forwardRef } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldBase =
  "w-full h-11 bg-white border border-swiss-line px-3 text-sm text-swiss-ink " +
  "focus:border-swiss-ink focus:outline-none placeholder:text-swiss-mute/70 rounded-sm";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...p }, ref) => (
    <input ref={ref} className={`${fieldBase} ${className}`} {...p} />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...p }, ref) => (
  <textarea
    ref={ref}
    className={`${fieldBase} h-auto py-2.5 ${className}`}
    {...p}
  />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className = "", children, ...p }, ref) => (
  <select ref={ref} className={`${fieldBase} ${className}`} {...p}>
    {children}
  </select>
));
Select.displayName = "Select";

export function Label({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block mb-1.5">
      <span className="eyebrow">{children}</span>
      {hint ? (
        <span className="block mt-0.5 text-[13px] text-swiss-mute">{hint}</span>
      ) : null}
    </label>
  );
}

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} hint={hint}>
        {label}
      </Label>
      {children}
    </div>
  );
}
