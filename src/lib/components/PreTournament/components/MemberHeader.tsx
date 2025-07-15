import type { Member } from "@prisma/client";

export interface MemberHeaderProps {
  member: Pick<Member, "firstname" | "lastname">;
}

export function MemberHeader({ member }: MemberHeaderProps) {
  return (
    <div className="text-2xl font-bold">
      {member?.firstname} {member?.lastname}
    </div>
  );
}
