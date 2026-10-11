"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { Languages } from "lucide-react";

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function LanguageSelector({
  value,
  onChange,
  disabled,
}: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Languages className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
        Language:
      </span>
      <Select
        value={value}
        onValueChange={(val) => {
          if (val) onChange(val);
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-[190px] h-9 bg-background">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <div className="flex items-center justify-between gap-3 w-full">
                <span>{lang.name}</span>
                <span className="text-xs text-muted-foreground font-sans">
                  {lang.nativeName}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
