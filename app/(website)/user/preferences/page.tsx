import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChefHat, Globe2, Leaf, ShieldCheck } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import AccountPageHeading from "../_components/account-page-heading";

const UserPreferencesPage = async () => {
  const user = await currentUser();
  if (!user) return null;

  const userDetails = await db.user.findUnique({
    where: { id: user.id },
    include: {
      foodPreference: true,
      cookingSkill: true,
      userCuisines: { include: { cuisine: true } },
      UserAllrgies: { include: { allergy: true } },
    },
  });

  const cuisines =
    userDetails?.userCuisines
      .map(({ cuisine }) => cuisine)
      .sort((a, b) => (a.position ?? 999) - (b.position ?? 999)) ?? [];
  const exclusions =
    userDetails?.UserAllrgies
      .map(({ allergy }) => allergy)
      .sort((a, b) => (a.position ?? 999) - (b.position ?? 999)) ?? [];

  return (
    <div>
      <AccountPageHeading
        eyebrow="Food choices"
        title="What belongs on your table"
        description="Your plan is shaped by everyday tastes, cuisines, exclusions and cooking comfort. Health or medical details are never requested here."
        action={
          <Link
            href="/meal-plan/create"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#bd382a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#aa3024]"
          >
            Edit choices <ArrowRight className="size-4" />
          </Link>
        }
      />

      <section className="mb-5 overflow-hidden rounded-[1.8rem] border border-[#eadcc9] bg-[#fffdf8] p-5 dark:border-white/10 dark:bg-[#10231c] sm:p-7">
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-[#faf0e2] p-4 dark:bg-[#172d25]">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#b63a2b] dark:text-[#dbb06c]" />
          <div>
            <p className="text-sm font-semibold text-[#392a20] dark:text-[#efeae2]">Taste-based personalization only</p>
            <p className="mt-1 text-sm leading-6 text-[#776659] dark:text-[#a9b8b0]">
              These choices help build recipe variety and avoid ingredients you do not want in a meal plan.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <ChoiceCard
            icon={Leaf}
            title="Food style"
            emptyLabel="Not selected"
            item={userDetails?.foodPreference ? {
              label: userDetails.foodPreference.name,
              imageUrl: userDetails.foodPreference.imageUrl,
            } : null}
          />
          <ChoiceCard
            icon={ChefHat}
            title="Cooking comfort"
            emptyLabel="Not selected"
            item={userDetails?.cookingSkill ? {
              label: userDetails.cookingSkill.title,
              imageUrl: userDetails.cookingSkill.imageUrl,
            } : null}
          />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <ImageCollection
          icon={Globe2}
          title="Favourite cuisines"
          helper="Used to add variety across your week"
          values={cuisines.map((cuisine) => ({
            id: cuisine.id,
            title: cuisine.title,
            imageUrl: cuisine.imageUrl,
          }))}
          emptyLabel="Choose cuisines to shape your weekly menu."
        />
        <ImageCollection
          icon={ShieldCheck}
          title="Ingredients to exclude"
          helper="Everyday exclusions selected by you"
          values={exclusions.map((allergy) => ({
            id: allergy.id,
            title: allergy.title,
            imageUrl: allergy.imageUrl,
          }))}
          emptyLabel="No ingredient exclusions selected."
        />
      </div>
    </div>
  );
};

interface ChoiceCardProps {
  icon: React.ElementType;
  title: string;
  emptyLabel: string;
  item: { label: string; imageUrl: string | null } | null;
}

const ChoiceCard = ({ icon: Icon, title, emptyLabel, item }: ChoiceCardProps) => (
  <div className="flex items-center gap-4 rounded-[1.35rem] border border-[#efe3d2] p-4 dark:border-white/[0.08]">
    {item?.imageUrl ? (
      <div className="relative size-16 shrink-0 overflow-hidden rounded-full border-2 border-[#efd9bc] dark:border-[#29453b]">
        <Image src={item.imageUrl} alt={item.label} fill className="object-cover" sizes="64px" />
      </div>
    ) : (
      <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#f6ead9] text-[#b43a2c] dark:bg-[#19352b] dark:text-[#e1b672]">
        <Icon className="size-6" />
      </div>
    )}
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#96765d] dark:text-[#c4aa77]">{title}</p>
      <p className="mt-1 font-semibold text-[#35271e] dark:text-[#f2ede6]">{item?.label ?? emptyLabel}</p>
    </div>
  </div>
);

interface ImageCollectionProps {
  icon: React.ElementType;
  title: string;
  helper: string;
  values: Array<{ id: string; title: string; imageUrl: string | null }>;
  emptyLabel: string;
}

const ImageCollection = ({ icon: Icon, title, helper, values, emptyLabel }: ImageCollectionProps) => (
  <section className="rounded-[1.7rem] border border-[#eadcc9] bg-[#fffdf8] p-5 dark:border-white/10 dark:bg-[#10231c] sm:p-6">
    <div className="mb-5 flex items-start gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f6e8d4] text-[#b43829] dark:bg-[#19352b] dark:text-[#ddb371]">
        <Icon className="size-5" />
      </div>
      <div>
        <h2 className="font-semibold text-[#30231b] dark:text-[#f2ede5]">{title}</h2>
        <p className="mt-1 text-xs text-[#817063] dark:text-[#aab8b0]">{helper}</p>
      </div>
    </div>
    {values.length > 0 ? (
      <div className="flex flex-wrap gap-x-5 gap-y-4">
        {values.map((value) => (
          <div key={value.id} className="group flex w-[84px] flex-col items-center gap-2.5 text-center sm:w-[92px]">
            <div className="relative size-[70px] overflow-hidden rounded-full border-2 border-[#ecd5b8] bg-[#f6ead9] shadow-[0_10px_24px_-18px_rgba(50,31,17,0.55)] dark:border-[#29453b] dark:bg-[#19352b] sm:size-[76px]">
              <Image
                src={value.imageUrl || "/assets/images/default-category.jpg"}
                alt={value.title}
                fill
                sizes="76px"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            </div>
            <span className="line-clamp-2 text-sm font-medium leading-5 text-[#534035] dark:text-[#e5dfd5]">{value.title}</span>
          </div>
        ))}
      </div>
    ) : (
      <p className="rounded-2xl bg-[#faf3e9] p-4 text-sm text-[#77665a] dark:bg-[#172d25] dark:text-[#aab8af]">{emptyLabel}</p>
    )}
  </section>
);

export default UserPreferencesPage;
