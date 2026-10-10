"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

import { cn } from "@/lib/utils";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

interface NavbarItemProps {
  item: {
    label: string;
    href: string;
    hasChild?: boolean;
    children?: {
      label: string;
      href: string;
    }[];
  };
}

const NavbarItem = ({ item }: NavbarItemProps) => {
  const pathname = usePathname();

  const isActive =
    pathname === item.href || pathname?.startsWith(`${item.href}/`);

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {item.hasChild ? (
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-transparent">
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-x-2 text-sm font-bold pl-6 transition-all",
                  isActive &&
                    "text-webprimary font-bold hover:text-websecondary"
                )}
              >
                {item.label}
              </Link>
            </NavigationMenuTrigger>
            {item.hasChild && (
              <NavigationMenuContent>
                <NavigationMenuLink>
                  <ul className="grid w-[200px]  ">
                    {item.children &&
                      item?.children.map((subitem) => (
                        <ListItem
                          key={subitem.href}
                          label={subitem.label}
                          href={subitem.href}
                        />
                      ))}
                  </ul>
                </NavigationMenuLink>
              </NavigationMenuContent>
            )}
          </NavigationMenuItem>
        ) : (
          <NavigationMenuItem>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-x-2 text-sm font-bold pl-6 transition-all",
                isActive && "text-webprimary font-bold hover:text-websecondary"
              )}
            >
              {item.label}
            </Link>
          </NavigationMenuItem>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default NavbarItem;

const ListItem = ({ label, href }: { label: string; href: string }) => {
  return (
    <li className=" border-b-2 border-gray-200 hover:bg-red-100">
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className="block select-none  p-3 leading-none no-underline outline-none transition"
        >
          <div className="text-sm font-bold leading-none">{label}</div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};
