interface AuthHeaderProps {
  label: string;
  description?: string;
  compact?: boolean;
}

export const AuthHeader = ({
  label,
  description,
  compact = false,
}: AuthHeaderProps) => {
  return (
    <div className={compact ? "text-center" : "text-left"}>
      <h1
        className={`font-semibold tracking-tight text-[#271c14] dark:text-[#f4f1ea] ${
          compact ? "text-2xl" : "text-3xl"
        }`}
      >
        {label}
      </h1>
      {description && (
        <p className="mt-2 text-sm leading-6 text-[#6e6053] dark:text-[#aba294]">{description}</p>
      )}
    </div>
  );
};
