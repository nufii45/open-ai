'use client';

import { type FormEvent, useRef } from 'react';
import { Loader } from '@/components/motion/loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { POPULAR_BRANDS } from '@/lib/drugs';

type SearchFormProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: (query: string) => void;
  isLoading: boolean;
  showEmptyError: boolean;
  compact?: boolean;
};

export function SearchForm({
  query,
  onQueryChange,
  onSearch,
  isLoading,
  showEmptyError,
  compact = false,
}: SearchFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(query);
    if (!query.trim()) inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-5 lg:max-w-2xl">
      {!compact ? (
        <div>
          <h1 className="max-w-[18ch] text-3xl font-bold tracking-[-0.03em] text-slate-950 text-balance sm:max-w-none lg:max-w-[21ch] lg:text-4xl">
            Compare your medicine price with confidence
          </h1>
          <p id="search-hint" className="mt-2 max-w-[61ch] text-sm leading-6 text-slate-600 sm:text-base">
            Search a brand to see a locally verified, like-for-like generic comparison.
          </p>
        </div>
      ) : (
        <p id="search-hint" className="sr-only">
          Search a brand to see a locally verified, like-for-like generic comparison.
        </p>
      )}

      {/* Enter submits via the native form. */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2" noValidate>
        <label htmlFor="medicine-search" className="text-sm font-medium text-slate-800">
          Medicine brand
        </label>
        <div className="flex gap-2">
          <Input
            id="medicine-search"
            ref={inputRef}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="e.g. Biogesic"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            aria-invalid={showEmptyError}
            aria-describedby={showEmptyError ? 'search-hint search-error' : 'search-hint'}
            className="h-12 flex-1 border-slate-300 bg-white px-3 text-base shadow-sm placeholder:text-slate-500 focus-visible:border-teal-600 focus-visible:ring-teal-600/20"
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 min-w-28 bg-teal-600 px-4 text-white shadow-sm transition-[background-color,transform] duration-200 ease-out hover:bg-teal-700 active:scale-[0.98] focus-visible:border-teal-600 focus-visible:ring-teal-600/30 motion-reduce:transition-none motion-reduce:transform-none"
          >
            {isLoading ? (
              <Loader
                variant="scramble"
                text="COMPARING"
                label="Comparing medicine"
                size={34}
                speed={0.9}
                className="text-white"
              />
            ) : (
              'Compare'
            )}
          </Button>
        </div>
        {showEmptyError ? (
          <p id="search-error" className="text-sm text-amber-700">
            Enter a medicine brand to compare.
          </p>
        ) : null}
      </form>

      {/* Popular curated brands — populate and submit the same form. */}
      <div>
        <p className="mb-2.5 text-xs font-medium text-slate-600">Try a verified brand</p>
        <div className="flex flex-wrap gap-2">
        {POPULAR_BRANDS.map((brand) => (
          <button
            key={brand}
            type="button"
            onClick={() => {
              onQueryChange(brand);
              onSearch(brand);
            }}
            aria-label={`Compare ${brand}`}
            className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition-[background-color,border-color,transform] duration-200 ease-out hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:transform-none"
          >
            {brand}
          </button>
        ))}
        </div>
      </div>
    </div>
  );
}
