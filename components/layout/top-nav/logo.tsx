import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

/** Brand mark (icon.png) + wordmark, linking home. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name} home`}
      className={cn(
        "flex items-center gap-2 font-semibold tracking-tight",
        className,
      )}
    >
      <Image
        src="/icon.png"
        alt={`${siteConfig.name} logo`}
        width={32}
        height={32}
        priority
        className="size-8 rounded-md object-contain"
      />
      <span>{siteConfig.name}</span>
    </Link>
  );
}
