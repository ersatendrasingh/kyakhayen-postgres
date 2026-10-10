import { Loader } from "lucide-react";

interface OverlayLoaderProps {
  isLoading: boolean;
}

const OverlayLoader = ({ isLoading }: OverlayLoaderProps) => {
  return (
    <div
      aria-busy={isLoading}
      className={`fixed inset-0 z-[100] flex items-center justify-center ${
        isLoading ? "" : "hidden"
      }`}
    >
      <div className="absolute inset-0 bg-[#160f0a]/50 backdrop-blur-sm" />
      <div className="relative z-10 flex items-center justify-center rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-[#10241e]">
        <Loader className="size-6 animate-spin" />
      </div>
    </div>
  );
};

export default OverlayLoader;
