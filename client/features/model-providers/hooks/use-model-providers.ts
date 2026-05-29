"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createModelProvider, getModelProviders } from "../api/model-providers-api";
import type { CreateModelProviderInput } from "../types";

export function useModelProviders() {
  return useQuery({
    queryKey: ["model-providers"],
    queryFn: getModelProviders,
  });
}

export function useCreateModelProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateModelProviderInput) => createModelProvider(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["model-providers"] });
    },
  });
}
