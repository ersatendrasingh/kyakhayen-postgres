import Image from "next/image";

type DevicePreviewProps = {
  className?: string;
};

export default function DevicePreview({ className = "" }: DevicePreviewProps) {
  return (
    <div className={`relative mx-auto w-full max-w-[650px] pb-[14%] pt-6 ${className}`}>
      <div className="relative w-[89%]">
        <div className="overflow-hidden rounded-[1rem] border-[5px] border-[#282725] bg-[#282725] p-1.5 shadow-[0_24px_50px_rgba(49,33,20,0.22)] sm:rounded-[1.3rem] sm:border-[7px]">
          <div className="relative overflow-hidden rounded-[0.55rem] bg-[#fffaf2] sm:rounded-[0.7rem]">
            <div className="absolute left-1/2 top-1.5 z-10 h-1.5 w-12 -translate-x-1/2 rounded-full bg-[#282725]/75" />
            <Image
              src="/assets/images/meal-plan-desktop-preview.webp"
              alt="Kya Khayen meal planner displayed on a laptop"
              width={1440}
              height={940}
              className="h-auto w-full object-cover object-top"
              priority
            />
          </div>
        </div>
        <div className="mx-auto h-2 w-[105%] -translate-x-[2.5%] rounded-b-[0.7rem] rounded-t-sm bg-gradient-to-b from-[#b9b4ad] to-[#827f7b] shadow-[0_10px_13px_rgba(35,27,20,0.18)] sm:h-3">
          <div className="mx-auto h-1 w-14 rounded-b-full bg-[#807c75]/55" />
        </div>
      </div>

      <div className="absolute bottom-0 right-0 w-[27%] min-w-[92px] overflow-hidden rounded-[1.4rem] border-[4px] border-[#2c2927] bg-[#2c2927] p-[3px] shadow-[0_22px_36px_rgba(42,28,19,0.28)] sm:rounded-[1.9rem] sm:border-[5px]">
        <div className="absolute left-1/2 top-[6px] z-10 h-[7px] w-[34%] -translate-x-1/2 rounded-full bg-[#2c2927]" />
        <Image
          src="/assets/images/meal-plan-mobile-preview.webp"
          alt="Kya Khayen meal planner displayed on a phone"
          width={506}
          height={1100}
          className="h-auto w-full rounded-[1.05rem] object-cover object-top sm:rounded-[1.45rem]"
          priority
        />
      </div>
    </div>
  );
}
