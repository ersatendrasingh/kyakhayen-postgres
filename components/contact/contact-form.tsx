"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contactFormSchema } from "@/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";

import { Button } from "../ui/button";

const ContactForm = () => {
  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      query: "",
    },
  });
  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof contactFormSchema>) => {
    try {
      const formData = new FormData();

      Object.entries(values).forEach(([key, value]) => {
        if (key !== "resumeFile") {
          formData.append(key, value);
        }
      });

      const response = await axios.post("/api/contact", formData);
      if (response.status === 200) {
        form.reset();
        toast.success(response.data, {
          duration: 5000,
        });
      }
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
        toast.error("Unable to submit your message.", {
          duration: 5000,
        });
      }
    }
  };
  const inputClassName =
    "h-12 rounded-xl border-[#e4d5be] bg-[#fffaf3] px-4 text-[#40342c] shadow-none placeholder:text-[#a49688] focus-visible:border-[#bc4637] focus-visible:ring-[#bc4637]/15 dark:border-white/10 dark:bg-[#132c24] dark:text-[#eef2ea] dark:placeholder:text-[#81938a]";

  return (
    <div className="mt-7 w-full">
      <div className="w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <p className="text-sm font-medium text-[#47392f] dark:text-[#dae4dc]">
                      Full name <span className="text-[#b83d30]">*</span>
                    </p>
                    <FormControl>
                      <Input
                        disabled={isSubmitting}
                        placeholder="Your name"
                        {...field}
                        className={inputClassName}
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
                    <p className="text-sm font-medium text-[#47392f] dark:text-[#dae4dc]">
                      Email address <span className="text-[#b83d30]">*</span>
                    </p>
                    <FormControl>
                      <Input
                        type="email"
                        disabled={isSubmitting}
                        placeholder="you@example.com"
                        {...field}
                        className={inputClassName}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="mt-4">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <p className="text-sm font-medium text-[#47392f] dark:text-[#dae4dc]">
                      Phone number <span className="text-[#b83d30]">*</span>
                    </p>
                    <FormControl>
                      <Input
                        disabled={isSubmitting}
                        placeholder="10 to 12 digit phone number"
                        {...field}
                        className={inputClassName}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <p className="text-sm font-medium text-[#47392f] dark:text-[#dae4dc]">
                      How can we help? <span className="text-[#b83d30]">*</span>
                    </p>
                    <FormControl>
                      <Textarea
                        disabled={isSubmitting}
                        {...field}
                        placeholder="Tell us the page or feature you need help with."
                        className="min-h-32 rounded-xl border-[#e4d5be] bg-[#fffaf3] px-4 py-3 text-[#40342c] placeholder:text-[#a49688] focus-visible:border-[#bc4637] focus-visible:ring-[#bc4637]/15 dark:border-white/10 dark:bg-[#132c24] dark:text-[#eef2ea] dark:placeholder:text-[#81938a]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="mt-6 flex items-center justify-end">
              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="h-12 rounded-full bg-[#be3d2e] px-7 text-sm font-semibold text-white hover:bg-[#a93327]"
              >
                {isSubmitting ? "Sending..." : "Send message"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ContactForm;
