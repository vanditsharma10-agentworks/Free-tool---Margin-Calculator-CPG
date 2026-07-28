import Link from "next/link";

import { siteConfig } from "@/config/site";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

/**
 * Desktop primary navigation: the plain top-level links from `siteConfig.nav`
 * plus the "Resources" mega-menu (Blog, Solutions, and free tools/pages as they
 * ship). The dropdown renders one column per non-empty group, so it starts
 * compact (a single "Explore" column) and grows into a multi-column mega-menu.
 */
export function NavLinks({ className }: { className?: string }) {
  const { nav, resources } = siteConfig;
  // Only groups that actually have links (an empty "Free tools" stays hidden
  // until its first tool is added).
  const groups = resources.groups.filter((g) => g.items.length > 0);
  const multiColumn = groups.length > 1;

  return (
    <NavigationMenu className={className}>
      <NavigationMenuList>
        {nav.map((item) => (
          <NavigationMenuItem key={item.href}>
            <NavigationMenuLink
              className="font-medium"
              render={
                item.href.startsWith("/") ? (
                  <Link href={item.href} />
                ) : (
                  <a href={item.href} />
                )
              }
            >
              {item.title}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}

        {groups.length > 0 ? (
          <NavigationMenuItem>
            <NavigationMenuTrigger className="font-medium">
              {resources.title}
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div
                className={
                  multiColumn
                    ? "grid w-[40rem] grid-cols-2 gap-x-4 gap-y-2 p-3"
                    : "grid w-80 gap-1 p-2"
                }
              >
                {groups.map((group) => (
                  <div key={group.title} className="flex flex-col gap-1">
                    {multiColumn ? (
                      <span className="px-2 pt-1 pb-0.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        {group.title}
                      </span>
                    ) : null}
                    {group.items.map((sub) => (
                      <NavigationMenuLink
                        key={sub.href}
                        render={<Link href={sub.href} />}
                        className="flex-col items-start gap-0.5"
                      >
                        <span className="font-medium text-foreground">
                          {sub.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {sub.description}
                        </span>
                      </NavigationMenuLink>
                    ))}
                  </div>
                ))}
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        ) : null}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
