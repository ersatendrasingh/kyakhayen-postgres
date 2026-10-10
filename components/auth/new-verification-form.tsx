"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { newVerification } from "@/actions/new-verification";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type NewVerificationFormProps = {
  token?: string | null;
};

export const NewVerificationForm = ({
  token: linkedToken = null,
}: NewVerificationFormProps) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [isPending, setIsPending] = useState(false);

  const submitCode = useCallback(
    async (token: string) => {
      if (success || isPending) return;
      if (!/^\d{6}$/.test(token) && !linkedToken) {
        setError("Enter the 6-digit code from your email.");
        return;
      }

      setError(undefined);
      setIsPending(true);
      try {
        const data = await newVerification(token);
        setSuccess(data.success);
        setError(data.error);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsPending(false);
      }
    },
    [isPending, linkedToken, success],
  );

  useEffect(() => {
    if (linkedToken) {
      const timer = window.setTimeout(() => {
        void submitCode(linkedToken);
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [linkedToken, submitCode]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitCode(code);
  };

  return (
    <CardWrapper
      headerLabel="Verify your email"
      description="Enter the 6-digit code we sent to your inbox. It expires in 10 minutes."
      backButtonLabel="Return to sign in"
      backButtonHref="/auth/login"
    >
      {isPending && !success ? (
        <div className="flex h-24 items-center justify-center gap-2 text-sm font-medium text-[#806e60]">
          <Loader2 className="size-5 animate-spin text-[#c23b2c]" />
          Verifying email
        </div>
      ) : null}
      {!linkedToken && !success && !isPending ? (
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            autoComplete="one-time-code"
            autoFocus
            inputMode="numeric"
            maxLength={6}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="000000"
            value={code}
            className="text-center text-xl font-semibold tracking-[0.35em]"
          />
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Verify email
          </Button>
        </form>
      ) : null}
      <FormSuccess message={success} />
      {!success && <FormError message={error} />}
    </CardWrapper>
  );
};
