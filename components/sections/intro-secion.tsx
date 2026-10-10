"use client";

import { Button } from "../ui/button";
import Container from "../container";
import Link from "next/link";
import DevicePreview from "@/components/meal-plan/device-preview";

export const IntroSection = () => {
  return (
    <section className="bg-websecondary py-12 md:py-0">
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl lg:text-5xl text-white leading-tight mb-6">
              Everyday Meal Ideas Made Simple
            </h1>
            <p className="text-lg lg:text-xl text-white leading-relaxed mb-8">
              Explore recipes and meal ideas customized around your tastes,
              favourite cuisines, available ingredients and cooking comfort.
              From quick breakfasts to family dinners, planning becomes simple.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center md:justify-start">
              <Button
                className="px-6 py-3 bg-webprimary text-white font-medium rounded-lg shadow hover:bg-white hover:text-webprimary transition"
                asChild
              >
                <Link href="/meal-plan/create">Create Meal Plan</Link>
              </Button>

              <Button className="px-6 py-3 border-2 border-white text-white font-medium bg-transparent rounded-lg hover:bg-webprimary hover:text-white transition">
                <Link href="/subscription-plans">
                  View Our Subscriptions Plans
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex-1 flex justify-center items-center">
            <DevicePreview />
          </div>
        </div>
      </Container>
    </section>
  );
};
