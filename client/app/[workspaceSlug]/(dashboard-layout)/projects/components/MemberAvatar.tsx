import { Project } from "@/features/projects/types";
import { getInitials } from "@/shared/utils/helpers";

export default function MemberAvatar({
  member,
}: {
  member: Project["members"][number];
}) {
  const name = member.fullName || member.username || member.email;

  if (member.avatarURL) {
    return (
      <div
        aria-label={name}
        className="size-8 rounded-full border-2 border-[var(--surface)] bg-cover bg-center"
        role="img"
        style={{
          backgroundImage: `url("${member.avatarURL}")`,
        }}
        title={name}
      />
    );
  }

  return (
    <div
      className="flex size-8 items-center justify-center rounded-full border-2 border-[var(--surface)] bg-[var(--secondary)] text-xs font-semibold text-[var(--text-secondary)]"
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
