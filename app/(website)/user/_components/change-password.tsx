"use client";

import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { changePasswordSchema } from "@/schemas";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
const ChangePassword = () => {
  const router = useRouter();
  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });
  const { isSubmitting, isValid } = form.formState;
  const onSubmit = async (values: z.infer<typeof changePasswordSchema>) => {
    try {
      const response = await axios.post("/api/user/change-password", values);
      router.push(`/user/profile/`);
      toast.success(response.data, {
        duration: 5000,
      });
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const message =
          typeof error.response?.data === "string"
            ? error.response.data
            : error.message;
        console.error("Axios Error:", message);
        toast.error(message, {
          duration: 5000,
        });
      } else if (error instanceof Error) {
        console.error("Error:", error.message);
        toast.error(error.message, {
          duration: 5000,
        });
      } else {
        toast.error("Unable to update password.", {
          duration: 5000,
        });
      }
    }
  };
  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="w-full space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <label className="text-sm font-medium text-[#554338] dark:text-[#e4ddd4]">Current password</label>
                    <FormControl>
                      <Input
                        type="password"
                        disabled={isSubmitting}
                        placeholder="Current password"
                        {...field}
                        className="h-12 w-full rounded-xl border-[#e6d7c4] bg-[#fffdfa] dark:border-white/10 dark:bg-[#152a23]"
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
                    <label className="text-sm font-medium text-[#554338] dark:text-[#e4ddd4]">New password</label>
                    <FormControl>
                      <Input
                        type="password"
                        disabled={isSubmitting}
                        placeholder="New password"
                        {...field}
                        className="h-12 w-full rounded-xl border-[#e6d7c4] bg-[#fffdfa] dark:border-white/10 dark:bg-[#152a23]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <label className="text-sm font-medium text-[#554338] dark:text-[#e4ddd4]">Confirm password</label>
                    <FormControl>
                      <Input
                        type="password"
                        disabled={isSubmitting}
                        placeholder="Confirm password"
                        {...field}
                        className="h-12 w-full rounded-xl border-[#e6d7c4] bg-[#fffdfa] dark:border-white/10 dark:bg-[#152a23]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-end pt-1">
              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="h-12 rounded-full bg-[#bd382a] px-7 font-semibold text-white hover:bg-[#aa3024]"
              >
                Update Password
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ChangePassword;
