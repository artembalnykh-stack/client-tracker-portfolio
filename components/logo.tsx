import Image from "next/image";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Logo({
  size = 28,
  withText = true,
  className,
}: {
  size?: number;
  withText?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/logo.svg"
        alt=""
        width={size}
        height={size}
        className="hidden dark:block"
        priority
      />
      <Image
        src="/logo-dark.svg"
        alt=""
        width={size}
        height={size}
        className="dark:hidden"
        priority
      />
      {withText ? (
        <span className="font-heading text-lg font-extrabold tracking-tight">
          {SITE_NAME}
        </span>
      ) : null}
    </span>
  );
}
