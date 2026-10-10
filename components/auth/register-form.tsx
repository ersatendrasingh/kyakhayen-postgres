"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { RegisterSchema } from "@/schemas";
import { register } from "@/actions/register";
import { login } from "@/actions/login";
import { newVerification } from "@/actions/new-verification";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

type RegisterFormProps = {
  callbackUrl?: string | null;
};

export const RegisterForm = ({ callbackUrl = null }: RegisterFormProps) => {
  const router = useRouter();
  const { update } = useSession();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      return register(values).then((data) => {
        setSuccess(data.success);
        setError(data.error);
        if (data.verificationRequired) {
          setAwaitingVerification(true);
        }
      });
    });
  };

  const verifyAndContinue = () => {
    setError("");
    setSuccess("");
    startTransition(() => {
      return newVerification(verificationCode)
        .then(async (verification) => {
          if (verification.error) {
            setError(verification.error);
            return;
          }

          const credentials = form.getValues();
          const signInResult = await login(
            {
              email: credentials.email,
              password: credentials.password,
            },
            callbackUrl,
          );
          if (signInResult.error) {
            setError(signInResult.error);
            return;
          }
          if (signInResult.twoFactor) {
            setSuccess(
              "Email verified. Please sign in and enter your security code.",
            );
            router.push(
              `/auth/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`,
            );
            return;
          }

          await update();
          router.push(callbackUrl || DEFAULT_LOGIN_REDIRECT);
          router.refresh();
        })
        .catch(() => setError("Verification could not be completed."));
    });
  };

  const loginHref = `/auth/login${
    callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""
  }`;

  return (
    <CardWrapper
      headerLabel={awaitingVerification ? "Verify your email" : "Create your account"}
      description={
        awaitingVerification
          ? "Enter the 6-digit code we sent. Your meal-plan choices are waiting for you."
          : "Save recipes and create a weekly menu made around your food choices."
      }
      backButtonLabel="Already have an account? Sign in"
      backButtonHref={loginHref}
      showSocial={!awaitingVerification}
      visualImage="/assets/images/auth-fruit-prep-hero.webp"
      visualAlt="Woman preparing fresh fruit in a bright kitchen"
      visualPosition="object-[60%_center]"
      visualHeadline="Make everyday meals feel effortless."
      callbackUrl={callbackUrl}
    >
      {awaitingVerification ? (
        <div className="space-y-5">
          <Input
            autoComplete="one-time-code"
            autoFocus
            inputMode="numeric"
            maxLength={6}
            onChange={(event) =>
              setVerificationCode(
                event.target.value.replace(/\D/g, "").slice(0, 6),
              )
            }
            placeholder="000000"
            value={verificationCode}
            className="text-center text-xl font-semibold tracking-[0.35em]"
          />
          <FormError message={error} />
          <FormSuccess message={success} />
          <Button
            disabled={isPending || verificationCode.length !== 6}
            className="w-full"
            onClick={verifyAndContinue}
            type="button"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Verifying
              </>
            ) : (
              "Verify & continue"
            )}
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isPending}
                        placeholder="John Doe"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone number</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        disabled={isPending}
                        placeholder="9876543210"
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
                    <FormLabel>Password</FormLabel>
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
            </div>
            <FormError message={error} />
            <FormSuccess message={success} />
            <SubmitButton isPending={isPending} submitText="Create account" />
          </form>
        </Form>
      )}
    </CardWrapper>
  );
};
