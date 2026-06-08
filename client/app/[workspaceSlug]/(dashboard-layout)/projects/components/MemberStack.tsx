import { Project } from "@/features/projects/types";
import MemberAvatar from "./MemberAvatar";

export default function MemberStack({
  members,
}: {
  members: Project["members"];
}) {
  const visibleMembers = members.slice(0, 4);
  const remainingCount = members.length - visibleMembers.length;

  return (
    <div className="flex items-center">
      {visibleMembers.map((member, index) => (
        <div
          key={member.id}
          className="-ml-2 first:ml-0"
          style={{ zIndex: visibleMembers.length - index }}
        >
          <MemberAvatar member={member} />
        </div>
      ))}

      {remainingCount > 0 && (
        <div className="-ml-2 flex size-8 items-center justify-center rounded-full border-2 border-[var(--surface)] bg-[var(--secondary)] text-[10px] font-semibold text-[var(--text-secondary)]">
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
