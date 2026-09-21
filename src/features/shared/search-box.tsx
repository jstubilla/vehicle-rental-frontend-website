"use client";

import { useEffect, useState } from "react";
import { FormField, Input } from "@/components/ui";

interface SearchBoxProps {
  /** The current search text (from the URL). */
  value: string;
  /** Called shortly after the person stops typing. */
  onSearch: (text: string) => void;
  label: string;
  placeholder?: string;
  delayMs?: number;
  className?: string;
}

/**
 * Search field that waits for a pause in typing before searching. If the search text
 * changes from outside (a "Clear filters" button, the Back button), the box follows.
 */
export function SearchBox({ value, onSearch, label, placeholder, delayMs = 300, className }: SearchBoxProps) {
  const [text, setText] = useState(value);
  const [sent, setSent] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);

  // The URL's value changed. If it is not something this box just sent, show it.
  if (value !== previousValue) {
    setPreviousValue(value);
    if (value !== sent) {
      setSent(value);
      setText(value);
    }
  }

  useEffect(() => {
    if (text === sent) return;
    const timer = setTimeout(() => {
      setSent(text);
      onSearch(text);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [text, sent, onSearch, delayMs]);

  return (
    <FormField label={label} hideLabel className={className}>
      <Input type="search" value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)} />
    </FormField>
  );
}
