"use client";

import { useState } from "react";
import { AppShell, Badge, Button, Card, CardBody, EmptyState, ErrorState, Field, Input, Select } from "@/shared/ui/components";
import { useCreateModelProvider, useModelProviders } from "../hooks/use-model-providers";
import type { ModelProviderType } from "../types";
import { ModelProvidersSkeleton } from "./model-providers-skeleton";

const providerTypes: ModelProviderType[] = ["OLLAMA", "OPENAI", "ANTHROPIC", "GEMINI", "LOCAL"];

export function ModelProvidersPage() {
  const providers = useModelProviders();
  const createProvider = useCreateModelProvider();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "OLLAMA" as ModelProviderType,
    baseUrl: "",
    modelName: "",
    apiKey: "",
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.modelName.trim()) return;
    createProvider.mutate(
      {
        name: form.name.trim(),
        type: form.type,
        baseUrl: form.baseUrl.trim() || undefined,
        modelName: form.modelName.trim(),
        apiKey: form.apiKey.trim() || undefined,
      },
      {
        onSuccess: () => {
          setForm({ name: "", type: "OLLAMA", baseUrl: "", modelName: "", apiKey: "" });
          setShowCreate(false);
        },
      },
    );
  }

  return (
    <AppShell
      title="Model providers"
      eyebrow="Settings"
      action={<Button onClick={() => setShowCreate((value) => !value)}>{showCreate ? "Close" : "Create provider"}</Button>}
    >
      <div className="grid gap-6">
        <div>
          <h2 className="text-lg font-semibold text-[#111827]">Provider settings</h2>
          <p className="mt-1 text-sm text-[#6B7280]">Configure OLLAMA, OPENAI, ANTHROPIC, GEMINI, or LOCAL providers for core team roles.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      {showCreate ? (
        <Card>
          <CardBody>
            <form className="grid gap-4" onSubmit={submit}>
              <Field label="Name">
                <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Local Ollama" />
              </Field>
              <Field label="Type">
                <Select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as ModelProviderType })}>
                  {providerTypes.map((type) => <option key={type}>{type}</option>)}
                </Select>
              </Field>
              <Field label="Base URL">
                <Input value={form.baseUrl} onChange={(event) => setForm({ ...form, baseUrl: event.target.value })} placeholder="http://localhost:11434" />
              </Field>
              <Field label="Model name">
                <Input value={form.modelName} onChange={(event) => setForm({ ...form, modelName: event.target.value })} placeholder="llama3.1" />
              </Field>
              <Field label="API key">
                <Input value={form.apiKey} onChange={(event) => setForm({ ...form, apiKey: event.target.value })} type="password" placeholder="Optional" />
              </Field>
              <Button type="submit" disabled={createProvider.isPending}>Create provider</Button>
            </form>
          </CardBody>
        </Card>
      ) : null}
      <section className={`grid content-start gap-3 ${showCreate ? "" : "lg:col-span-2"}`}>
          {providers.isLoading ? <ModelProvidersSkeleton /> : null}
          {providers.isError ? <ErrorState message="Could not load model providers." /> : null}
          {providers.data?.length === 0 ? <EmptyState title="No model providers" description="Add a provider before assigning one to a core team role." /> : null}
          {providers.data?.map((provider) => (
            <Card key={provider.id}>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-[#111827]">{provider.name}</h2>
                    <p className="mt-1 text-sm text-[#6B7280]">{provider.model_name}</p>
                    {provider.base_url ? <p className="mt-1 text-xs text-[#6B7280]">{provider.base_url}</p> : null}
                  </div>
                  <Badge tone="cyan">{provider.type}</Badge>
                </div>
              </CardBody>
            </Card>
          ))}
        </section>
        </div>
      </div>
    </AppShell>
  );
}
