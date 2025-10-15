import * as React from "react";

import { cn } from "@/lib/utils";

interface CustomInputProps extends React.ComponentProps<"input"> {
  rightText?: string;
  leftText?: string;
  leftButtonText?: string;
  leftButtonClassName?: string;
  onLeftButtonClick?: () => void;
  variant?: "positive";
}

const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
  (
    { className, type, leftButtonText, onLeftButtonClick, leftButtonClassName, leftText, rightText, variant, ...props },
    ref
  ) => {
    return (
      <div className="flex items-center border rounded-md overflow-hidden">
        {leftText && <span className="px-1 text-muted-foreground text-xs whitespace-nowrap">{leftText}</span>}
        {leftButtonText && (
            <button
              type="button"
              onClick={onLeftButtonClick}
              className={cn("flex-shrink-0 basis-[60px] px-2 text-xs h-full border-r border-gray-500 font-medium whitespace-nowrap focus:outline-none", leftButtonClassName)}
            >
              {leftButtonText}
             
            </button>
        )}
        <input
          type={type}
          className={cn(
            // remove border & radius from input, wrapper handles it
            "flex h-9 w-full border-0 rounded-none bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          ref={ref}
          onKeyDown={(e) => {
            if (variant === "positive" && (e.key === "-" || e.key === "e" || e.key === "+" || e.key === "E")) {
              e.preventDefault(); // block minus and exponent input
            }
          }}
          {...props}
        />
        {rightText && <span className="px-1 text-muted-foreground text-xs whitespace-nowrap">{rightText}</span>}
      </div>
    );
  }
);
CustomInput.displayName = "CustomInput";

export { CustomInput };
