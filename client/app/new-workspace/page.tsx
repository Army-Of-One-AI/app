'use client';

import Button from '@/shared/ui/Button';
import { classNames } from '@/shared/styles/classNames';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import slugify from 'slugify';
import { useRouter } from 'next/navigation';
import useCreateWorkspace from '@/features/workspaces/hooks/useCreateWorkspace';
import axios from 'axios';

type CreateWorkspaceFormValues = {
  name: string;
  slug: string;
  logoURL: string;
};

export default function CreateWorkspacePage() {
  const router = useRouter();

  const {
    mutate: createWorkspace,
    isPending: isCreatingWorkspace,
  } = useCreateWorkspace();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateWorkspaceFormValues>({
    defaultValues: {
      name: '',
      slug: '',
      logoURL: '',
    },
  });

  const name = watch('name');

  useEffect(() => {
    setValue(
      'slug',
      slugify(name, {
        lower: true,
        strict: true,
        trim: true,
      }),
      {
        shouldValidate: true,
      }
    );
  }, [name, setValue]);

  const errorMessages = Object.values(errors)
    .map((error) => error.message)
    .filter(Boolean);

  const getInputClassName = (hasError?: boolean) => `
    h-10 w-full rounded-lg border px-3 text-sm outline-none transition
    ${classNames.input.bg}
    ${classNames.input.text}
    ${classNames.input.placeholder}
    ${
      hasError
        ? `${classNames.danger.border} ${classNames.danger.focus} ${classNames.danger.ring}`
        : `${classNames.input.border} ${classNames.input.focus}`
    }
  `;

  const onSubmit = async (data: CreateWorkspaceFormValues) => {
    const payload = {
      name: data.name.trim(),
      slug: slugify(data.slug, {
        lower: true,
        strict: true,
        trim: true,
      }),
      ...(data.logoURL.trim() && {
        logoURL: data.logoURL.trim(),
      }),
    };

    createWorkspace(payload, {
      onSuccess: (workspace) => {
        router.push(`/${workspace.slug}`);
      },
      onError: (err) => {
        if (!axios.isAxiosError(err)) return;

        const serverErrors = err.response?.data?.errors;

        if (!serverErrors) return;

        Object.entries(serverErrors).forEach(([field, message]) => {
          setError(field as keyof CreateWorkspaceFormValues, {
            type: 'server',
            message: String(message),
          });
        });
      },
    });
  };

  return (
    <main
      className={`
        relative min-h-screen
        ${classNames.background}
        ${classNames.text.primary}
      `}
    >
      <div className="mx-auto w-full max-w-[420px] px-6 pt-[18vh]">
        <div className="mb-8 text-center">
          <h1 className="text-lg font-semibold">Create a workspace</h1>

          <p className={`mt-3 text-sm ${classNames.text.secondary}`}>
            Move work forward across teams and agents
          </p>
        </div>

        {errorMessages.length > 0 && (
          <div className={`mb-5 rounded-lg border px-4 py-3 ${classNames.danger.border} ${classNames.danger.bg}`}>
            <ul className={`list-disc space-y-1 pl-4 text-sm ${classNames.danger.text}`}>
              {errorMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className={`mb-2 block text-xs ${classNames.text.secondary}`}>
              Name
            </label>

            <input
              autoFocus
              {...register('name', {
                required: 'Workspace name is required',
              })}
              className={getInputClassName(Boolean(errors.name))}
            />
          </div>

          <div>
            <label className={`mb-2 block text-xs ${classNames.text.secondary}`}>
              URL
            </label>

            <div
              className={`
                flex h-10 items-center overflow-hidden rounded-lg border transition
                ${
                  errors.slug
                    ? `${classNames.danger.border} focus-within:border-[var(--danger)] focus-within:ring-2 focus-within:ring-[var(--focus-danger)]`
                    : `${classNames.input.border} focus-within:border-[var(--primary)]`
                }
                ${classNames.input.bg}
              `}
            >
              <div
                className={`
                  flex h-full items-center border-r px-3 text-sm
                  ${classNames.secondary.bg}
                  ${errors.slug ? classNames.danger.border : classNames.input.border}
                  ${classNames.text.secondary}
                `}
              >
                {process.env.NEXT_PUBLIC_APP_URL}/
              </div>

              <input
                {...register('slug', {
                  required: 'Workspace URL is required',
                  onChange: (e) => {
                    setValue(
                      'slug',
                      slugify(e.target.value, {
                        lower: true,
                        strict: true,
                        trim: true,
                      }),
                      {
                        shouldValidate: true,
                      }
                    );
                  },
                })}
                className={`
                  min-w-0 flex-1 px-3 text-sm outline-none
                  ${classNames.input.bg}
                  ${classNames.input.text}
                  ${classNames.input.placeholder}
                `}
              />
            </div>
          </div>

          <div>
            <label className={`mb-2 block text-xs ${classNames.text.secondary}`}>
              Logo URL
              <span className="ml-1">(optional)</span>
            </label>

            <input
              {...register('logoURL')}
              placeholder="https://example.com/logo.png"
              className={getInputClassName(Boolean(errors.logoURL))}
            />

            <p className={`mt-1 text-xs ${classNames.text.secondary}`}>
              Leave empty to use the workspace initials.
            </p>
          </div>

          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting || isCreatingWorkspace}
            className="mt-6 h-10 w-full rounded-full"
          >
            {isSubmitting || isCreatingWorkspace
              ? 'Creating...'
              : 'Create workspace'}
          </Button>
        </form>
      </div>

      <div
        className={`
          fixed bottom-8 left-1/2 -translate-x-1/2
          text-center text-xs
          ${classNames.text.secondary}
        `}
      >
        <p>Using hoangvule.183@gmail.com</p>

        <button
          type="button"
          onClick={() => router.push('/login')}
          className="mt-2 hover:underline"
        >
          Use a different email
        </button>
      </div>
    </main>
  );
}
