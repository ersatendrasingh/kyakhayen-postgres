interface MenuItemProps {
  tabTitle: string;
  isLast?: boolean;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

const MenuItem = ({
  tabTitle,
  isLast,
  isActive,
  onClick,
  className,
}: MenuItemProps) => {
  return (
    <button
      className={`${className} ${
        isLast ? "" : "mr-3"
      } px-5 mx-4 py-2 text-sm font-normal rounded-full ${
        isActive ? "bg-websecondary text-white" : "bg-gray-200 text-gray-700"
      }`}
      onClick={onClick}
    >
      {tabTitle}
    </button>
  );
};

export default MenuItem;
