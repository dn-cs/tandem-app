"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// ── Icons ─────────────────────────────────────────────────────────────────────

function PaletteIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3C7.03 3 3 7.03 3 12c0 4.97 4.03 9 9 9 .83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99C12.73 16.67 13.4 16 14.23 16H16c2.76 0 5-2.24 5-5C21 6.58 16.97 3 12 3zM6.5 11C5.67 11 5 10.33 5 9.5S5.67 8 6.5 8 8 8.67 8 9.5 7.33 11 6.5 11zm3-4C8.67 7 8 6.33 8 5.5S8.67 4 9.5 4s1.5.67 1.5 1.5S10.33 7 9.5 7zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 4 14.5 4s1.5.67 1.5 1.5S15.33 7 14.5 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 8 17.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  );
}

function SmileyIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
      <path d="M3 15l5-5 4 4 3-3 5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Content ───────────────────────────────────────────────────────────────────

function ActivityGuideContent({ onContinue }: { onContinue: () => void }) {
  return (
    <main className="flex flex-col min-h-screen bg-white px-10 py-12">

      {/* ── Title ──────────────────────────────────────────────────────────── */}
      <h1 className="text-5xl font-black text-black text-center mb-10">Activity Guide</h1>

      <div className="max-w-2xl mx-auto w-full flex flex-col gap-8 flex-1">

        {/* ── Subtitle ─────────────────────────────────────────────────────── */}
        <p className="text-2xl font-normal" style={{ color: "#333" }}>Word Association</p>

        {/* ── Description ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <p className="text-base font-bold text-black">Description</p>
          <p className="text-base leading-relaxed" style={{ color: "#333" }}>
            This activity is designed to engage cognition and conversation through word
            association. We encourage you to ask open-ended questions like &ldquo;why did you
            choose that word&rdquo; to promote deeper connections and dialogue with your
            patient.
          </p>
        </div>

        {/* ── Instructions ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <p className="text-base font-bold text-black">Instructions</p>
          <ol className="flex flex-col gap-1.5 list-decimal list-inside text-base" style={{ color: "#333" }}>
            <li>Ask the patient to connect the word on screen to something.</li>
            <li>Type out the word in the space below to add to the list.</li>
            <li>Take turns associating words based on the previous word.</li>
          </ol>
        </div>

        {/* ── Variations ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <p className="text-base font-bold text-black">Variations</p>
          <div className="flex gap-4">
            {[
              { label: "Themed Association",  icon: <PaletteIcon /> },
              { label: "Only Emotions",        icon: <SmileyIcon /> },
              { label: "Memory Connections",   icon: <ImageIcon /> },
            ].map(({ label, icon }) => (
              <div
                key={label}
                className="flex-1 flex flex-col justify-between rounded-2xl p-4"
                style={{ border: "1.5px solid #E0E0E0", minHeight: 130 }}
              >
                <p className="text-sm font-medium text-black leading-snug">{label}</p>
                <div className="flex justify-end text-gray-400">{icon}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Continue ─────────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto w-full mt-10">
        <button
          onClick={onContinue}
          className="w-full py-5 rounded-full text-white text-xl font-semibold active:scale-[0.98] transition-all"
          style={{ background: "#888" }}
        >
          Continue
        </button>
      </div>
    </main>
  );
}

// ── Inline version (used from inside the game as a modal) ─────────────────────
// Exported so game.tsx can import and overlay it.
export function ActivityGuideInline({ onReturn }: { onReturn: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="px-10 py-12 max-w-2xl mx-auto flex flex-col gap-8">

        <h2 className="text-5xl font-black text-black text-center">Activity Guide</h2>

        <p className="text-2xl font-normal" style={{ color: "#333" }}>Word Association</p>

        <div className="flex flex-col gap-2">
          <p className="text-base font-bold text-black">Description</p>
          <p className="text-base leading-relaxed" style={{ color: "#333" }}>
            This activity is designed to engage cognition and conversation through word
            association. We encourage you to ask open-ended questions like &ldquo;why did you
            choose that word&rdquo; to promote deeper connections and dialogue with your
            patient.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-base font-bold text-black">Instructions</p>
          <ol className="flex flex-col gap-1.5 list-decimal list-inside text-base" style={{ color: "#333" }}>
            <li>Ask the patient to connect the word on screen to something.</li>
            <li>Type out the word in the space below to add to the list.</li>
            <li>Take turns associating words based on the previous word.</li>
          </ol>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-base font-bold text-black">Variations</p>
          <div className="flex gap-4">
            {[
              { label: "Themed Association",  icon: <PaletteIcon /> },
              { label: "Only Emotions",        icon: <SmileyIcon /> },
              { label: "Memory Connections",   icon: <ImageIcon /> },
            ].map(({ label, icon }) => (
              <div
                key={label}
                className="flex-1 flex flex-col justify-between rounded-2xl p-4"
                style={{ border: "1.5px solid #E0E0E0", minHeight: 130 }}
              >
                <p className="text-sm font-medium text-black leading-snug">{label}</p>
                <div className="flex justify-end text-gray-400">{icon}</div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onReturn}
          className="w-full py-5 rounded-full text-white text-xl font-semibold active:scale-[0.98] transition-all"
          style={{ background: "#888" }}
        >
          Return to Activity
        </button>
      </div>
    </div>
  );
}

// ── Page (standalone route) ───────────────────────────────────────────────────

function PageContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const code         = searchParams.get("code") ?? "";

  function handleContinue() {
    router.replace(`/room/${code}/waiting`);
  }

  return <ActivityGuideContent onContinue={handleContinue} />;
}

export default function ActivityGuidePage() {
  return (
    <Suspense>
      <PageContent />
    </Suspense>
  );
}
