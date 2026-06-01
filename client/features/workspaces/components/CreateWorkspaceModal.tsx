"use client";

import Button from "@/shared/ui/Button";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import slugify from "slugify";

type CreateWorkspaceFormValues = {
  name: string;
  slug: string;
  logoURL: string;
};

type CreateWorkspaceModalProps = {
  onClose: () => void;
  onCreate: (data: { name: string; slug: string; logoURL?: string }) => void;
  isLoading?: boolean;
};

export default function CreateWorkspaceModal({
  onClose,
  onCreate,
  isLoading = false,
}: CreateWorkspaceModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateWorkspaceFormValues>({
    defaultValues: {
      name: "",
      slug: "",
      logoURL: "",
    },
  });

  const name = watch("name");
  const slug = watch("slug");

  useEffect(() => {
    setValue(
      "slug",
      slugify(name, {
        lower: true,
        strict: true,
        trim: true,
      })
    );
  }, [name, setValue]);

  const onSubmit = (data: CreateWorkspaceFormValues) => {
    onCreate({
      name: data.name.trim(),
      slug: slugify(data.slug, {
        lower: true,
        strict: true,
        trim: true,
      }),
      ...(data.logoURL.trim() && {
        logoURL: data.logoURL.trim(),
      }),
    });
  };

  return (
    <div className="w-125" onClick={(e) => e.stopPropagation()}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Workspace name
          </label>

          <input
            {...register("name", {
              required: "Workspace name is required",
            })}
            placeholder="Army of One"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
          />

          {errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Workspace URL
          </label>

          <div className="flex items-center overflow-hidden rounded-xl border border-gray-300 transition focus-within:border-gray-900">
            <div className="bg-gray-50 px-3 py-2 text-sm text-gray-500">
              {process.env.NEXT_PUBLIC_APP_URL}/
            </div>

            <input
              {...register("slug", {
                required: "Workspace URL is required",
                onChange: (e) => {
                  setValue(
                    "slug",
                    slugify(e.target.value, {
                      lower: true,
                      strict: true,
                      trim: true,
                    })
                  );
                },
              })}
              placeholder="my-workspace"
              className="flex-1 px-3 py-2 text-sm outline-none"
            />
          </div>

          {errors.slug && (
            <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>
          )}

          <p className="mt-1 text-xs text-gray-500">
            Your workspace will be available at{" "}
            <span className="font-medium text-gray-700">
              {process.env.NEXT_PUBLIC_APP_URL}/{slug || "my-workspace"}
            </span>
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Logo URL
            <span className="ml-1 text-gray-400">(optional)</span>
          </label>

          <input
            {...register("logoURL")}
            placeholder="https://example.com/logo.png"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>

          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
    </div>
  );
}
