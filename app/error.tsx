"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-ink">This page could not be loaded</h1>
      <p className="mt-4 text-stone-700">Something unexpected happened while loading this page. Your inputs have not been saved or sent anywhere. Please try again.</p>
      <button type="button" onClick={reset} className="mt-8 rounded-xl bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark">Try again</button>
    </div>
  );
}
