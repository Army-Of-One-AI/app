import { classNames } from "@/shared/styles/classNames";

type Props = {
  title: string;
  customHeader?: React.ReactNode;
  children: React.ReactNode;
};

export default function PageContent({ children, customHeader, title }: Props) {
  return (
    <div className={`w-full flex flex-col h-full`}>
      {!customHeader && (
        <header
          className={`sticky z-100 top-0 w-full px-2 py-4 border-b ${classNames.border} ${classNames.background}`}
        >
          {title}
        </header>
      )}
      {customHeader && (
        <header
          className={`sticky z-100 top-0 w-full border-b ${classNames.border} ${classNames.background}`}
        >
          {customHeader}
        </header>
      )}
      <main
        className={`w-full h-[calc(100vh-145px)] overflow-y-auto ${classNames.surface} ${classNames.text.primary}`}
      >
        {children}
      </main>
    </div>
  );
}
