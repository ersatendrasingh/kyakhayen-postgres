"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { CardWrapper } from "@/components/auth/card-wrapper";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { LoginSchema } from "@/schemas";
import { login } from "@/actions/login";
import { newVerification } from "@/actions/new-verification";
import { SubmitButton } from "@/components/submit-button";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

interface LoginFormProps {
  callBackUrl?: string;
  callbackUrl?: string | null;
  urlError?: string;
  mode?: "modal" | "redirect";
}

export const LoginForm = ({
  callBackUrl,
  callbackUrl: callbackUrlProp,
  mode,
  urlError = "",
}: LoginFormProps) => {
  const router = useRouter();
  const { update } = useSession();
  const callbackUrl = callbackUrlProp || callBackUrl || null;
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      if (showEmailVerification) {
        if (!values.code || values.code.length !== 6) {
          setError("Enter the 6-digit code sent to your email.");
          return;
        }
        setIsLoading(true);
        return newVerification(values.code)
          .then(async (verification) => {
            if (verification.error) {
              setError(verification.error);
              setIsLoading(false);
              return;
            }

            const signInResult = await login(
              { email: values.email, password: values.password },
              callbackUrl,
            );
            if (signInResult?.twoFactor) {
              setShowEmailVerification(false);
              setShowTwoFactor(true);
              setSuccess("Email verified. Enter your sign-in security code.");
              setIsLoading(false);
              return;
            }
            if (signInResult?.error) {
              setError(signInResult.error);
              setIsLoading(false);
              return;
            }

            await update();
            router.push(callbackUrl || DEFAULT_LOGIN_REDIRECT);
            router.refresh();
          })
          .catch(() => {
            setError("Verification could not be completed.");
            setIsLoading(false);
          });
        return;
      }

      setIsLoading(true);
      return login(values, callbackUrl)
        .then(async (data) => {
          if (data?.error) {
            setError(data.error);
            setIsLoading(false);
            return;
          }

          if (data?.verificationRequired) {
            setSuccess(data.success);
            setIsLoading(false);
            setShowEmailVerification(true);
            return;
          }

          if (data?.success) {
            form.reset();
            setSuccess(data.success);

            localStorage.setItem("toastDisplayed", "false");
            await update();
            router.push(callbackUrl || DEFAULT_LOGIN_REDIRECT);
            router.refresh();
            return;
          }

          if (data?.twoFactor) {
            setShowTwoFactor(true);
            setIsLoading(false);
            return;
          }
        })
        .catch(() => {
          setError("Something went wrong");
          setIsLoading(false);
        });
    });
  };

  return (
    <CardWrapper
      headerLabel={showEmailVerification ? "Verify your email" : "Welcome back"}
      description={
        showEmailVerification
          ? "Enter the 6-digit code we sent. Your meal-plan choices are waiting."
          : "Sign in to continue your saved recipes and weekly meal plans."
      }
      backButtonLabel="Don't have an account? Create one"
      backButtonHref={`/auth/register${
        callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""
      }`}
      showSocial
      compact={mode === "modal"}
      callbackUrl={callbackUrl}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {(showTwoFactor || showEmailVerification) && (
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {showEmailVerification
                        ? "Email verification code"
                        : "Two-factor code"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="123456"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {!showTwoFactor && !showEmailVerification && (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          disabled={isPending}
                          placeholder="john.doe@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between gap-3">
                        <FormLabel>Password</FormLabel>
                        <Button
                          size="sm"
                          variant="link"
                          asChild
                          className="h-auto px-0 py-0 text-xs font-medium text-primary"
                        >
                          <Link href="/auth/reset">Forgot password?</Link>
                        </Button>
                      </div>
                      <FormControl>
                        <Input
                          type="password"
                          disabled={isPending}
                          placeholder="******"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            {showEmailVerification && (
              <p className="text-sm leading-6 text-[#695b4e]">
                We will sign you in and continue your meal plan automatically
                after confirmation.
              </p>
            )}
          </div>
          <FormError message={error || urlError} />
          <FormSuccess message={isLoading ? "" : success} />
          <SubmitButton
            isPending={isPending || isLoading}
            submitText={
              showEmailVerification
                ? "Verify & continue"
                : showTwoFactor
                  ? "Confirm code"
                  : "Sign in"
            }
          />
        </form>
      </Form>
    </CardWrapper>
  );
};
