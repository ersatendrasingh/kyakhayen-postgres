import * as React from "react";
import { X } from "lucide-react";
import { Command, CommandGroup, CommandItem, CommandList } from "cmdk";
import { Badge } from "@/components/ui/badge";

type Option = {
  value: string;
  label: string;
};

interface MultiSelectProps {
  options: Option[];
  defaultValues?: Option[];
  placeholder?: string;
  onChange: (selectedOptions: Option[]) => void;
}

export function MultiSelect({
  options,
  placeholder = "",
  onChange,
  defaultValues,
}: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Option[]>(defaultValues || []);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = React.useCallback((option: Option) => {
    setSelected((prev) => prev.filter((s) => s.value !== option.value));
  }, []);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === "Delete" || e.key === "Backspace") {
          if (input.value === "") {
            setSelected((prev) => {
              const newSelected = [...prev];
              newSelected.pop();
              return newSelected;
            });
          }
        }
        // This is not a default behaviour of the <input /> field
        if (e.key === "Escape") {
          input.blur();
        }
      }
    },
    []
  );
  const selectables = options.filter(
    (option) => !selected.some((s) => s.value === option.value)
  );

  React.useEffect(() => {
    onChange(selected);
  }, [selected, onChange]);
  return (
    <div className="bg-white">
      <Command
        onKeyDown={handleKeyDown}
        className="overflow-visible bg-transparent"
      >
        <div className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md">
          <div className="flex gap-1 flex-wrap">
            {selected.map((option) => (
              <Badge key={option.value} variant="destructive" className="p-2">
                {option.label}
                <button
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(option);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(option)}
                >
                  <X className="h-3 w-3 " />
                </button>
              </Badge>
            ))}
            <Command.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              onBlur={() => setOpen(false)}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              className="ml-2 p-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
            />
          </div>
        </div>
        <div className="relative ">
          {open && selectables.length > 0 ? (
            <div className="absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none transition-all duration-200 ease-in-out">
              <CommandGroup className="h-full overflow-auto">
                <CommandList>
                  {selectables.map((option) => (
                    <CommandItem
                      key={option.value}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onSelect={() => {
                        setInputValue("");
                        setSelected((prev) => [...prev, option]);
                      }}
                      className={
                        "cursor-pointer hover:bg-gray-200 p-2 pl-4 text-sm transition-all duration-200 ease-in-out"
                      }
                    >
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandList>
              </CommandGroup>
            </div>
          ) : null}
        </div>
      </Command>
    </div>
  );
}
