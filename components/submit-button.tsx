"use client";

import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";

interface SubmitButtonProps {
  isPending: boolean;
  submitText: string;
}

export const SubmitButton = ({ isPending, submitText }: SubmitButtonProps) => {
  return (
    <Button type="submit" className="w-full" disabled={isPending}>
      {isPending ? (
        <>
          <Loader className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        submitText
      )}
    </Button>
  );
};
