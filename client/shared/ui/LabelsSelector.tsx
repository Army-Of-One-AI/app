'use client'

import { TaskLabel } from "@/features/tasks/types"
import { FormEvent, useCallback, useEffect, useRef, useState } from "react"

type Props = {
    labels: TaskLabel[]
    onCreate: (name: string) => void;
}

export default function LabelsSelector({
    labels,
    onCreate
}: Props) {
    const isComposingRef = useRef(false);
    const [searchValue, setSearchValue] = useState("")
    const [isFocusing, setFocusing] = useState(false)

    return (
        <div className="relative w-full">
            <div className="w-full flex flex-row items-start justify-start gap-2 bg-[yellow]">
                <input
                    value={searchValue}
                    onFocus={() => setFocusing(true)}
                    onBlur={() => setFocusing(false)}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onCompositionStart={() => {
                        isComposingRef.current = true;
                    }}
                    onCompositionEnd={() => {
                        isComposingRef.current = false;
                    }}
                    onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        if (isComposingRef.current || e.nativeEvent.isComposing) return;

                        e.preventDefault();

                        const value = e.currentTarget.value.trim();
                        if (!value) return;

                        alert(value);
                    }}
                />
            </div>
            {isFocusing &&
                <div className="w-full absolute mt-2  left-0 h-200 bg-[red]">
                </div>
            }
        </div>
    )
}