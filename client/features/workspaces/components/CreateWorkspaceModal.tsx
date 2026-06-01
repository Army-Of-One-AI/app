'use client';

import Button from '@/shared/ui/Button';
import { useState } from 'react';
import slugify from 'slugify';

type CreateWorkspaceModalProps = {
  onClose: () => void;
  onCreate: (data: {
    name: string;
    slug: string;
    logoURL?: string;
  }) => void;
  isLoading?: boolean;
};

export default function CreateWorkspaceModal({
  onClose,
  onCreate,
  isLoading = false,
}: CreateWorkspaceModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoURL, setLogoURL] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);

    if (!slugTouched) {
      setSlug(
        slugify(value, {
          lower: true,
          strict: true,
          trim: true,
        }),
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !slug.trim()) return;

    onCreate({
      name: name.trim(),
      slug: slugify(slug, {
        lower: true,
        strict: true,
        trim: true,
      }),
      ...(logoURL.trim() && {
        logoURL: logoURL.trim(),
      }),
    });
  };

  return (
    <div
      className="w-[500px]"
      onClick={(e) => e.stopPropagation()}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Workspace name
          </label>

          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Army of One"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
          />
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
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);

                setSlug(
                  slugify(e.target.value, {
                    lower: true,
                    strict: true,
                    trim: true,
                  }),
                );
              }}
              placeholder="my-workspace"
              className="flex-1 px-3 py-2 text-sm outline-none"
            />
          </div>

          <p className="mt-1 text-xs text-gray-500">
            Your workspace will be available at{' '}
            <span className="font-medium text-gray-700">
              {process.env.NEXT_PUBLIC_APP_URL}/{slug || 'my-workspace'}
            </span>
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Logo URL
            <span className="ml-1 text-gray-400">(optional)</span>
          </label>

          <input
            value={logoURL}
            onChange={(e) => setLogoURL(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <Button type='primary' onClick={() => { }}>
            {isLoading ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  );
}