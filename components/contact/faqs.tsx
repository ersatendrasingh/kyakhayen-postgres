import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQ() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger className="text-left text-sm font-medium text-[#372c24] dark:text-[#e8eee7]">
          How can I contact support?
        </AccordionTrigger>
        <AccordionContent className="text-sm leading-7 text-[#706155] dark:text-[#aab8b1]">
          You can reach our support team via email at{" "}
          <a
            href="mailto:mailtokyakhayen@gmail.com"
            className="text-[#b53a2d] underline underline-offset-4 dark:text-[#dfae62]"
          >
            mailtokyakhayen@gmail.com
          </a>{" "}
          or through the contact form on this page.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger className="text-left text-sm font-medium text-[#372c24] dark:text-[#e8eee7]">
          When can I expect a response?
        </AccordionTrigger>
        <AccordionContent className="text-sm leading-7 text-[#706155] dark:text-[#aab8b1]">
          We review support messages as soon as possible. Include the relevant
          page and issue details so we can respond more effectively.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger className="text-left text-sm font-medium text-[#372c24] dark:text-[#e8eee7]">
          Is there a phone number I can call?
        </AccordionTrigger>
        <AccordionContent className="text-sm leading-7 text-[#706155] dark:text-[#aab8b1]">
          At this time, we only provide support via email and the contact form.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-4">
        <AccordionTrigger className="text-left text-sm font-medium text-[#372c24] dark:text-[#e8eee7]">
          How do I find specific recipes?
        </AccordionTrigger>
        <AccordionContent className="text-sm leading-7 text-[#706155] dark:text-[#aab8b1]">
          You can use the search bar on any page of our website to find specific
          recipes. Simply enter the name of the recipe or ingredients you have,
          and we&apos;ll show you a list of all matching records.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-5">
        <AccordionTrigger className="text-left text-sm font-medium text-[#372c24] dark:text-[#e8eee7]">
          Can I save my favorite recipes?
        </AccordionTrigger>
        <AccordionContent className="text-sm leading-7 text-[#706155] dark:text-[#aab8b1]">
          Yes, you can save your favorite recipes by creating an account and
          adding them to your favorites. This way, you can easily access them
          anytime you&apos;re logged in.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-6">
        <AccordionTrigger className="text-left text-sm font-medium text-[#372c24] dark:text-[#e8eee7]">
          How do I create a meal plan?
        </AccordionTrigger>
        <AccordionContent className="text-sm leading-7 text-[#706155] dark:text-[#aab8b1]">
          Create an account, choose your everyday food preferences and generate
          a meal plan. During launch, meal-plan access is available without a
          paid subscription.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-7">
        <AccordionTrigger className="text-left text-sm font-medium text-[#372c24] dark:text-[#e8eee7]">
          Can you advise me about a medical diet or allergy?
        </AccordionTrigger>
        <AccordionContent className="text-sm leading-7 text-[#706155] dark:text-[#aab8b1]">
          No. Kya Khayen provides recipe information only. For allergy,
          intolerance, medical or prescribed dietary needs, consult a qualified
          professional and independently verify every ingredient.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
