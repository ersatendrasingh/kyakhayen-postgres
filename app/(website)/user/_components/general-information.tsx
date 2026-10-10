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
import { userProfileSchema } from "@/schemas";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { Loader2 } from "lucide-react";

const GeneralInformation = () => {
  const router = useRouter();
  const user = useCurrentUser();
  const { update } = useSession();

  const form = useForm<z.infer<typeof userProfileSchema>>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      bio: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  useEffect(() => {
    if (user) {
      const fullName = user.name?.split(" ") ?? [];
      const defaultValues = {
        firstName: fullName[0] ?? "",
        lastName: fullName.slice(1).join(" ") ?? "",
        email: user.email ?? "",
        phoneNumber: user.phoneNumber ?? "",
        bio: user.bio ?? "",
      };
      form.reset(defaultValues);
    }
  }, [user, form]);

  const [phoneNumber, setPhoneNumber] = useState("");
  const debouncedPhoneNumber = useDebounce(phoneNumber, 500);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkPhoneNumber = async () => {
      if (debouncedPhoneNumber) {
        setIsChecking(true);
        try {
          await axios.post("/api/user/check-phone", {
            phoneNumber: debouncedPhoneNumber,
          });
          form.clearErrors("phoneNumber");
          setIsChecking(false);
        } catch {
          form.setError("phoneNumber", {
            type: "manual",
            message: "Phone number already exists",
          });
          setIsChecking(false);
        }
      }
    };

    checkPhoneNumber();
  }, [debouncedPhoneNumber, form]);

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setPhoneNumber(value);
    form.setValue("phoneNumber", value, { shouldValidate: true });
  };

  const onSubmit = async (values: z.infer<typeof userProfileSchema>) => {
    try {
      await axios.patch("/api/user", values);
      update();
      router.push(`/user/profile/`);

      toast.success("Profile updated successfully", {
        duration: 5000,
      });
    } catch {
      toast.error("Something went wrong while updating profile", {
        duration: 5000,
      });
    }
  };

  if (!user) {
    return (
      <div className="space-y-8 mt-4 w-full">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="w-full space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <label className="text-sm font-medium text-[#554338] dark:text-[#e4ddd4]">First name</label>
                    <FormControl>
                      <Input
                        disabled={isSubmitting}
                        placeholder="First name"
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
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <label className="text-sm font-medium text-[#554338] dark:text-[#e4ddd4]">Last name</label>
                    <FormControl>
                      <Input
                        disabled={isSubmitting}
                        placeholder="Last name"
                        {...field}
                        className="h-12 w-full rounded-xl border-[#e6d7c4] bg-[#fffdfa] dark:border-white/10 dark:bg-[#152a23]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <label className="text-sm font-medium text-[#554338] dark:text-[#e4ddd4]">Email address</label>
                    <FormControl>
                      <Input
                        disabled={true}
                        placeholder="Email address"
                        {...field}
                        className="h-12 w-full rounded-xl border-[#e6d7c4] bg-[#f7f0e6] dark:border-white/10 dark:bg-[#152a23]"
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
                    <label className="text-sm font-medium text-[#554338] dark:text-[#e4ddd4]">Phone number</label>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Phone number"
                          {...field}
                          className="h-12 w-full rounded-xl border-[#e6d7c4] bg-[#fffdfa] pr-10 dark:border-white/10 dark:bg-[#152a23]"
                          onChange={handlePhoneNumberChange}
                        />
                      </FormControl>
                      {isChecking && (
                        <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin" />
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <label className="text-sm font-medium text-[#554338] dark:text-[#e4ddd4]">About you</label>
                    <FormControl>
                      <Textarea
                        disabled={isSubmitting}
                        {...field}
                        placeholder="A short introduction for your account"
                        className="h-28 w-full rounded-xl border-[#e6d7c4] bg-[#fffdfa] dark:border-white/10 dark:bg-[#152a23]"
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
                Update Profile
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default GeneralInformation;
