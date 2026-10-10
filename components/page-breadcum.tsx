"use client";

import { SlashIcon } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

interface PageBreadcumProps {
  currentPage: string;
  className?: string;
  otherClass?: string;
}

const PageBreadcum = ({
  currentPage,
  className,
  otherClass,
}: PageBreadcumProps) => {
  return (
    <Breadcrumb className="flex items-center justify-center  py-2 text-white font-bold">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" className={cn("text-white", className)}>
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <SlashIcon className="text-white" />
        </BreadcrumbSeparator>

        <BreadcrumbItem>
          <BreadcrumbPage className={cn("text-white", otherClass)}>
            {currentPage}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default PageBreadcum;
