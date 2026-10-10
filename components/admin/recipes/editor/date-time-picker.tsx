"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Clock3, RotateCcw } from "lucide-react";
import { format, isValid, setHours, setMinutes } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const hours = Array.from({ length: 12 }, (_, index) => index + 1);
const minutes = [0, 15, 30, 45];

function parseLocal(value: string) {
  if (!value) return new Date();
  const date = new Date(value);
  return isValid(date) ? date : new Date();
}

function toLocalValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Choose date and time",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => parseLocal(value), [value]);
  const [hour, setHour] = useState(String(selected.getHours() % 12 || 12));
  const [minute, setMinute] = useState(String(selected.getMinutes()));
  const [period, setPeriod] = useState(selected.getHours() >= 12 ? "PM" : "AM");

  const updateTime = (nextHour = hour, nextMinute = minute, nextPeriod = period) => {
    let h = Number(nextHour) % 12;
    if (nextPeriod === "PM") h += 12;
    const next = setMinutes(setHours(selected, h), Number(nextMinute));
    onChange(toLocalValue(next));
  };

  const chooseDate = (date?: Date) => {
    if (!date) return;
    const next = new Date(date);
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    onChange(toLocalValue(next));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className={cn("h-11 w-full justify-start rounded-xl px-3 text-left font-normal", !value && "text-muted-foreground")}>
          <CalendarDays className="mr-2 size-4 text-primary" />
          {value ? format(selected, "dd MMM yyyy, hh:mm a") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto rounded-2xl p-0">
        <Calendar mode="single" selected={value ? selected : undefined} onSelect={chooseDate} />
        <div className="border-t p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground"><Clock3 className="size-3.5" /> Time</div>
          <div className="grid grid-cols-3 gap-2">
            <select aria-label="Hour" value={hour} onChange={(event) => { setHour(event.target.value); updateTime(event.target.value); }} className="h-9 rounded-lg border bg-background px-2 text-sm">
              {hours.map((item) => <option key={item} value={item}>{String(item).padStart(2, "0")}</option>)}
            </select>
            <select aria-label="Minute" value={minute} onChange={(event) => { setMinute(event.target.value); updateTime(hour, event.target.value); }} className="h-9 rounded-lg border bg-background px-2 text-sm">
              {minutes.map((item) => <option key={item} value={item}>{String(item).padStart(2, "0")}</option>)}
            </select>
            <select aria-label="AM or PM" value={period} onChange={(event) => { setPeriod(event.target.value); updateTime(hour, minute, event.target.value); }} className="h-9 rounded-lg border bg-background px-2 text-sm">
              <option>AM</option><option>PM</option>
            </select>
          </div>
          <div className="mt-3 flex justify-between gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}><RotateCcw className="mr-1 size-3.5" /> Clear</Button>
            <Button type="button" size="sm" onClick={() => { onChange(toLocalValue(new Date())); setOpen(false); }}>Today</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
