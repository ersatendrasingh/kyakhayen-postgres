"use client";

import { cn } from "@/lib/utils";

import Container from "@/components/container";
import PageBreadcum from "../page-breadcum";

interface PageTitleProps {
  title: string;
  className?: string;
}

export default function PageTitle({ title, className }: PageTitleProps) {
  return (
    <div
      className={cn(
        "w-full flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 text-white bg-opacity-25 mt-2 py-4",
        className
      )}
    >
      <Container>
        <div className="flex items-center justify-center">
          <div className=" text-center w-full">
            <h2 className="text-2xl lg:text-3xl xl:text-4xl mb-2 transition-all duration-1000 ease-in-out transform animate-slide-in">
              {title}
            </h2>
            <PageBreadcum currentPage={title} />
          </div>
        </div>
      </Container>
    </div>
  );
}
