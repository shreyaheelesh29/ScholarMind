import { forwardRef } from "react";

const variants = {
  primary: "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
  outline: "border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger: "bg-error-500 text-white hover:bg-error-600",
  success: "bg-success-500 text-white hover:bg-success-600",
  accent: "bg-gradient-to-r from-accent-600 to-accent-500 text-white shadow-lg shadow-accent-500/25 hover:shadow-xl",
};

const sizes = {
  xs: "px-2.5 py-1.5 text-xs rounded-md",
  sm: "px-3 py-2 text-sm rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-xl",
  xl: "px-8 py-4 text-lg rounded-xl",
};

const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    className = "",
    children,
    leftIcon,
    rightIcon,
    loading,
    disabled,
    fullWidth,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
        variants[variant]
      } ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

export default Button;
