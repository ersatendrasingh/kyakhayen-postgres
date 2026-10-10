import { LockKeyhole, UserRound } from "lucide-react";
import { currentUser } from "@/lib/auth";
import ChangePassword from "../_components/change-password";
import GeneralInformation from "../_components/general-information";
import AccountPageHeading from "../_components/account-page-heading";
import { PushNotificationSettings } from "@/components/notifications/push-notification-settings";

const SettingsPage = async () => {
  const user = await currentUser();
  if (!user) return null;

  return (
    <div>
      <AccountPageHeading
        eyebrow="Settings"
        title="Account settings"
        description="Update the details attached to your account and control sign-in security from one place."
      />
      <div className="space-y-5">
        <PushNotificationSettings />
        <section className="rounded-[1.8rem] border border-[#eadcc9] bg-[#fffdf8] p-5 dark:border-white/10 dark:bg-[#10231c] sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#f6ead9] text-[#b63a2b] dark:bg-[#19352b] dark:text-[#dbb16f]">
              <UserRound className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-[#31241c] dark:text-[#f2ede6]">Personal details</h2>
              <p className="text-sm text-[#7c6a5d] dark:text-[#a9b9af]">Contact and profile information</p>
            </div>
          </div>
          <GeneralInformation />
        </section>

        {!user.isOAuth && (
          <section className="rounded-[1.8rem] border border-[#eadcc9] bg-[#fffdf8] p-5 dark:border-white/10 dark:bg-[#10231c] sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#f6ead9] text-[#b63a2b] dark:bg-[#19352b] dark:text-[#dbb16f]">
                <LockKeyhole className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold text-[#31241c] dark:text-[#f2ede6]">Password</h2>
                <p className="text-sm text-[#7c6a5d] dark:text-[#a9b9af]">Keep access to your account secure</p>
              </div>
            </div>
            <ChangePassword />
          </section>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
