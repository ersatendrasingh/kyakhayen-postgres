import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarHeaderProps {
  selectedDate: Date | null;
  onDayClick: (date: Date) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
}

const CalendarHeader = ({
  selectedDate,
  onDayClick,
  onPrevDay,
  onNextDay,
}: CalendarHeaderProps) => {
  const currentDate = selectedDate || new Date();
  const start = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));

  return (
    <section className="-mx-4 border-y border-[#eadcc8] bg-white px-4 py-3 dark:border-white/10 dark:bg-[#10241e] sm:mx-0 sm:rounded-2xl sm:border sm:p-4 sm:shadow-sm sm:dark:shadow-none">
      <div className="mb-3 flex items-center justify-between gap-3 sm:mb-3">
        <div>
          <p className="hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a6b42] dark:text-[#d7a45d] sm:block">
            Week of {format(start, "d MMM")}
          </p>
          <p className="text-base font-semibold text-[#2c2118] dark:text-[#f5f1e8] sm:hidden">
            {format(currentDate, "MMMM yyyy")}
          </p>
          <p className="text-[11px] font-medium text-[#8b7a69] dark:text-[#9eaea6] sm:hidden">
            Weekly planner
          </p>
          <p className="hidden text-xs text-[#695b4e] dark:text-[#b5c1bb] sm:block">
            {format(start, "d MMM")} - {format(addDays(start, 6), "d MMM yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPrevDay}
            aria-label="Previous day"
            className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-[#eadcc8] bg-[#fffaf2] text-[#4c3c2f] transition hover:border-primary hover:text-primary dark:border-white/10 dark:bg-[#142b23] dark:text-[#e5eee7] dark:hover:border-[#d9a556] dark:hover:text-[#e1b366]"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={onNextDay}
            aria-label="Next day"
            className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-[#eadcc8] bg-[#fffaf2] text-[#4c3c2f] transition hover:border-primary hover:text-primary dark:border-white/10 dark:bg-[#142b23] dark:text-[#e5eee7] dark:hover:border-[#d9a556] dark:hover:text-[#e1b366]"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:hidden">
        {days.map((day) => {
          const active = isSameDay(day, currentDate);
          const today = isSameDay(day, new Date());
          return (
            <button
              type="button"
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              aria-pressed={active}
              className={`flex min-w-0 cursor-pointer flex-col items-center rounded-full border py-2 text-center transition ${
                active
                  ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                  : "border-transparent bg-[#fffaf2] text-[#4c3c2f] hover:border-[#dec8ad] dark:bg-[#142b23] dark:text-[#e5eee7] dark:hover:border-white/20"
              }`}
            >
              <span className="block text-[9px] font-semibold uppercase tracking-[0.1em] opacity-70">
                {format(day, "EEEEE")}
              </span>
              <span className="mt-1 block text-sm font-semibold leading-5">
                {format(day, "d")}
              </span>
              <span
                className={`mt-1 size-1 rounded-full ${
                  today
                    ? active
                      ? "bg-white"
                      : "bg-primary"
                    : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>
      <div className="hidden gap-1.5 sm:flex">
        {days.map((day) => {
          const active = isSameDay(day, currentDate);
          const today = isSameDay(day, new Date());
          return (
            <button
              type="button"
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              aria-pressed={active}
              className={`min-w-0 flex-1 cursor-pointer rounded-xl border px-2 py-2 text-center transition ${
                active
                  ? "border-primary bg-primary text-white shadow-lg shadow-primary/20"
                  : "border-transparent bg-[#fffaf2] text-[#4c3c2f] hover:border-[#dec8ad] dark:bg-[#142b23] dark:text-[#e5eee7] dark:hover:border-white/20"
              }`}
            >
              <span className="block text-[10px] font-semibold uppercase tracking-[0.13em] opacity-75">
                {format(day, "EEE")}
              </span>
              <span className="mt-1 block text-base font-semibold leading-5">
                {format(day, "d")}
              </span>
              <span className="block text-[10px] opacity-75">
                {today ? "Today" : format(day, "MMM")}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default CalendarHeader;
