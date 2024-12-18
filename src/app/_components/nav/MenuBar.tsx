"use client";

import { BookText, Home, List, Trophy } from "lucide-react";
import Link from "next/link";
import { cn } from "@/src/lib/utils";
import { NavItem } from "./NavItem";

interface MenuBarProps {
  className?: string;
}

export default function MenuBar({ className }: MenuBarProps) {
  return (
    <div className={cn(className, "h-14")}>
      <NavItem href={"/"} children={<Home size={"2.25rem"} />} />
      <NavItem href={"/tournament"} children={<List size={"2.25rem"} />} />
      <NavItem href={"/standings"} children={<Trophy size={"2.25rem"} />} />
      <NavItem href={"/rulebook"} children={<BookText size={"2.25rem"} />} />
      <div className="flex min-w-[2.25rem] items-center justify-center">
        {/* <Skeleton className="h-[2.25rem] w-[2.25rem] rounded-full" /> */}
        {/* <UserAccountNav /> */}
      </div>
    </div>
  );
}
