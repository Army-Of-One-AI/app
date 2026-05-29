"use client";

import { useEffect, useMemo, useState } from "react";

const defaultTips = [
  "The Product Owner is expanding your idea into product direction.",
  "Good software plans usually start with clear user problems.",
  "The PM will turn selected features into execution-ready tasks.",
  "Local models can take a little longer depending on your machine.",
  "You can review and edit everything before creating tasks.",
];

export type GenerationLoadingCardProps = {
  title: string;
  subtitle?: string;
  tips?: string[];
  startedAt?: Date;
};

function elapsedSeconds(startedAt: Date | undefined) {
  if (!startedAt) return undefined;
  return Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000));
}

export function GenerationLoadingCard({
  title,
  subtitle,
  tips = defaultTips,
  startedAt,
}: GenerationLoadingCardProps) {
  const availableTips = tips.length > 0 ? tips : defaultTips;
  const [tipIndex, setTipIndex] = useState(0);
  const [elapsed, setElapsed] = useState(() => elapsedSeconds(startedAt));
  const dots = useMemo(() => Array.from({ length: 3 }), []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTipIndex((current) => (current + 1) % availableTips.length);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [availableTips.length]);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(undefined);
      return undefined;
    }

    const tick = () => setElapsed(elapsedSeconds(startedAt));
    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [startedAt]);

  return (
    <div role="status" aria-live="polite" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#4F46E5] shadow-[0_0_0_6px_rgba(79,70,229,0.10)] animate-pulse" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
              {subtitle ? <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p> : null}
            </div>
            {elapsed !== undefined ? (
              <span className="rounded-full border border-[#E5E7EB] bg-[#F7F8FC] px-3 py-1 text-xs font-medium text-[#6B7280]">
                Running for {elapsed}s
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[#4F46E5]">
            <span>Generating</span>
            <span className="flex gap-1">
              {dots.map((_, index) => (
                <span
                  key={index}
                  className="h-1.5 w-1.5 rounded-full bg-[#4F46E5] animate-bounce"
                  style={{ animationDelay: `${index * 140}ms` }}
                />
              ))}
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#EEF2FF]">
            <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#4F46E5]/10 via-[#4F46E5] to-[#06B6D4]/40 animate-pulse" />
          </div>

          <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3">
            <p className="text-sm text-[#0891B2]">
              <span className="font-semibold">Tip:</span> {availableTips[tipIndex]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
