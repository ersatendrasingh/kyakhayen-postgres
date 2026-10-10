import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-fade";
import { EffectFade, Autoplay } from "swiper/modules";
import { IoIosArrowDroprightCircle } from "react-icons/io";
import Link from "next/link";
import useWindowSize from "@/hooks/use-window-size";
import Container from "@/components/container";

interface HomeSlideBannerProps {
  banners: {
    id: number;
    title: string;
    spanTxt: string;
    btnTxt: string;
    image: string;
    href?: string;
    points?: string[];
  }[];
}

const HomeSlideBanner = ({ banners }: HomeSlideBannerProps) => {
  const { width } = useWindowSize();
  const isMobile = width !== undefined && width <= 767;

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <Container>
        <Swiper
          className="w-full max-w-[1300px] h-full"
          autoplay={{
            delay: 6000,
            disableOnInteraction: false,
          }}
          loop={true}
          effect="fade"
          modules={[Autoplay, EffectFade]}
          fadeEffect={{ crossFade: true }}
        >
          {banners.map((banner) => (
            <SwiperSlide key={banner.id}>
              <div className="w-full flex flex-col md:flex-row items-center justify-center">
                <div className="md:w-1/2 flex flex-col items-start justify-end md:items-start p-4 text-left">
                  <h2 className="text-3xl font-bold text-websecondary mb-2 break-words">
                    {banner.title}
                  </h2>
                  <p className="text-lg text-webprimary font-semibold mb-4 break-words">
                    {banner.spanTxt}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {banner.points?.map((point, index) => (
                      <div
                        key={index}
                        className="flex text-sm font-semibold items-center break-words"
                      >
                        <span className="mr-2">
                          <IoIosArrowDroprightCircle className="text-md text-websecondary" />
                        </span>
                        {point}
                      </div>
                    ))}
                  </div>
                  <Link href={banner.href || "/"}>
                    <button className="bg-websecondary text-white py-2 px-4 rounded-lg">
                      {banner.btnTxt}
                    </button>
                  </Link>
                </div>
                <div className="md:w-1/2 flex justify-center md:justify-end p-4">
                  <Image
                    src={banner.image || "/assets/images/default-category.jpg"}
                    alt={banner.title || "Category Image"}
                    width={isMobile ? 320 : 450}
                    height={isMobile ? 320 : 450}
                    className="rounded-lg md:rounded-none"
                  />
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>
    </div>
  );
};

export default HomeSlideBanner;
