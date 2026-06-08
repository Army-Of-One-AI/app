import { classNames } from "@/shared/styles/classNames";

type Props = {
  title: string;
  customHeader?: React.ReactNode;
  children: React.ReactNode;
};

export default function PageContent({ children, customHeader, title }: Props) {
  return (
    <div className="flex h-full w-full min-w-0 flex-col">
      {!customHeader && (
        <header
          className={`shrink-0 border-b px-5 py-4 text-sm font-semibold ${classNames.border} ${classNames.background} ${classNames.text.primary}`}
        >
          {title}
        </header>
      )}
      {customHeader && (
        <header
          className={`shrink-0 border-b ${classNames.border} ${classNames.background}`}
        >
          {customHeader}
        </header>
      )}
      <main
        className={`min-h-0 flex-1 overflow-y-auto ${classNames.surface} ${classNames.text.primary}`}
      >
        {children}
      </main>
    </div>
  );
}
