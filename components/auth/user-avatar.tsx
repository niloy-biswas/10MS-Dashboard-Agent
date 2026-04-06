"use client";

import Image from "next/image";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md";
}

export function UserAvatar({ name, avatarUrl, size = "md" }: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const dimension = size === "sm" ? 28 : 32;
  const textClass = size === "sm" ? "text-xs" : "text-xs";
  const sizeClass = size === "sm" ? "h-7 w-7" : "h-8 w-8";

  if (avatarUrl) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden border border-border/50 shrink-0`}>
        <Image
          src={avatarUrl}
          alt={name}
          width={dimension}
          height={dimension}
          className="object-cover w-full h-full"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center ${textClass} font-bold text-primary shrink-0`}
    >
      {initials}
    </div>
  );
}
