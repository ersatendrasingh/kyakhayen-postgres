import { cn } from "@/lib/utils";

interface AccountPageHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

const AccountPageHeading = ({ eyebrow, title, description, action, className }: AccountPageHeadingProps) => {
  return (
    <header className={cn("mb-5 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-2xl">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b13a2b] dark:text-[#dcad69]">{eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[#2d2119] dark:text-[#f4efe8] sm:text-[2.35rem]">{title}</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#78685d] dark:text-[#abbbb1] sm:text-base">{description}</p>
      </div>
      {action}
    </header>
  );
};

export default AccountPageHeading;
