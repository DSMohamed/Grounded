import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [text]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setText("");
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-2">
      <div className="relative rounded-2xl border border-border/60 bg-card shadow-lg transition-colors focus-within:border-evidence/40">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Ask about skin cancer prevention counseling…"
          rows={1}
          disabled={disabled}
          className={cn(
            "w-full resize-none bg-transparent px-4 py-3.5 pr-14 text-[15px] leading-relaxed outline-none",
            "placeholder:text-muted-foreground/50",
            "disabled:opacity-50",
          )}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          className={cn(
            "absolute bottom-2.5 right-2.5 flex size-8 items-center justify-center rounded-lg transition-all",
            text.trim()
              ? "bg-evidence text-evidence-foreground hover:opacity-90"
              : "bg-muted/50 text-muted-foreground",
            "disabled:opacity-30",
          )}
        >
          <ArrowUp className="size-4" strokeWidth={2.5} />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-center gap-3">
        <span className="font-mono text-[10px] text-muted-foreground/40">
          Grounded · evidence-bound answers from USPSTF skin cancer prevention guideline
        </span>
      </div>
    </div>
  );
}
