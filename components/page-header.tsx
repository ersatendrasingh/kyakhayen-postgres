"use client";

import { cn } from "@/lib/utils";

import Container from "@/components/container";
import PageBreadcum from "@/components/page-breadcum";

interface PageHeaderProps {
  title: string;
  className?: string;
}

export const PageHeader = ({ title, className }: PageHeaderProps) => {
  return (
    <div
      className={cn(
        "w-full flex bg-websecondary items-center justify-center ",
        className
      )}
    >
      <Container>
        <div className="w-full">
          <h1 className="text-2xl lg:text-3xl xl:text-4xl mb-2 text-white transition-all duration-1000 ease-in-out transform animate-slide-in">
            {title}
          </h1>
          <PageBreadcum currentPage={title} />
        </div>
      </Container>
    </div>
  );
};
