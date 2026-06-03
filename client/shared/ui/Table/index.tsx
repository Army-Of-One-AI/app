import { classNames } from "@/shared/styles/classNames";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

type TableColumn<T> = {
  label: string;
  field: keyof T;
  render?: (rowData: T) => ReactNode;
};

type Props<T> = {
  data: T[];
  columns: TableColumn<T>[];
  getRowKey: (row: T) => string | number;
  className?: HTMLAttributes<HTMLTableElement>["className"];
  stickyHeader?: boolean;
  stickyTopGap?: number;
  isLoading?: boolean;
  skeletonRows?: number;
  emptyText?: string;
};

export default function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  getRowKey,
  className,
  stickyHeader = false,
  stickyTopGap = 0,
  isLoading = false,
  skeletonRows = 10,
  emptyText = "No records found",
}: Props<T>) {
  const stickyMaskStyle: CSSProperties = {
    top: 0,
    height: stickyTopGap,
  };

  const stickyHeaderStyle: CSSProperties = {
    top: stickyTopGap,
  };

  return (
    <table className={`${className ?? ""} w-full shadow-xs`}>
      <thead>
        {stickyHeader && stickyTopGap > 0 && (
          <tr
            style={stickyMaskStyle}
            className={`
              sticky z-30
              ${classNames.surface}
            `}
          >
            <th colSpan={columns.length} className="p-0" />
          </tr>
        )}

        <tr
          style={stickyHeader ? stickyHeaderStyle : undefined}
          className={`
            ${stickyHeader ? "sticky" : ""}
            z-20 h-10 text-left
            ${classNames.background}
            ${classNames.text.primary}
          `}
        >
          {columns.map((col) => (
            <th
              key={String(col.field)}
              className="px-4 py-2 text-sm font-medium"
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {isLoading ? (
          Array.from({ length: skeletonRows }).map((_, rowIndex) => (
            <tr
              key={`skeleton-${rowIndex}`}
              className={`border-b ${classNames.border}`}
            >
              {columns.map((col, colIndex) => (
                <td key={String(col.field)} className="px-4 py-6">
                  <div
                    style={{
                      animationDelay: `${(rowIndex + colIndex) * 80}ms`,
                    }}
                    className={`
                      h-4 animate-pulse rounded-md ${classNames.skeleton}
                      ${colIndex === 0 ? "w-32" : "w-24"}
                    `}
                  />
                </td>
              ))}
            </tr>
          ))
        ) : data.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className={`px-4 py-12 text-center text-sm ${classNames.text.secondary}`}
            >
              {emptyText}
            </td>
          </tr>
        ) : (
          data.map((item) => (
            <tr
              key={getRowKey(item)}
              className={`
                cursor-pointer text-sm transition-all hover:brightness-95
                ${classNames.text.primary} ${classNames.surface}
              `}
            >
              {columns.map((col) => {
                const value = item[col.field];

                return (
                  <td key={String(col.field)} className="px-4 py-4">
                    {col.render ? col.render(item) : String(value ?? "")}
                  </td>
                );
              })}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
