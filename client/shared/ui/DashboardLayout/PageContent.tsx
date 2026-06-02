import { classNames } from "@/shared/styles/classNames";

type Props = {
  title: string;
  customHeader?: React.ReactNode;
  children: React.ReactNode;
}

export default function PageContent({
  children,
  customHeader,
  title,
}: Props) {
  return (
    <div className="w-full flex flex-col">
      <header className={`sticky top-0 w-full px-2 py-3 border-b ${classNames.border} ${classNames.background}`}>
        {customHeader || title}
      </header>
      <main className={`w-full p-2 min-h-screen ${classNames.background} ${classNames.text.primary}`}>
        {children}
      </main>
    </div>
  );
}
