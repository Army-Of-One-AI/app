import Link from "next/link";
import { AppShell, Card, CardBody } from "@/shared/ui/components";

export default function SettingsPage() {
  return (
    <AppShell title="Settings" eyebrow="System">
      <div className="grid gap-4">
        <Card>
          <CardBody>
            <h2 className="font-semibold text-[#111827]">Model providers</h2>
            <p className="mt-1 text-sm text-[#6B7280]">Configure local or external model providers for core team roles.</p>
            <Link className="mt-4 inline-flex text-sm font-medium text-[#4F46E5]" href="/settings/model-providers">
              Open model providers
            </Link>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
