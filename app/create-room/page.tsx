"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// Exclude I and O to avoid confusion with 1 and 0
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateCode(): string {
  return Array.from(
    { length: 4 },
    () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  ).join("");
}

export default function CreateRoom() {
  const router = useRouter();
  const [error, setError] = useState("");
  const creating = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode double-invocation
    if (creating.current) return;
    creating.current = true;

    async function create() {
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = generateCode();
        const { error: insertError } = await supabase
          .from("rooms")
          .insert({ code, status: "waiting" });

        if (!insertError) {
          // Create a matching Daily.co video room (non-fatal — game works without it)
          try {
            const dailyRes = await fetch("/api/create-daily-room", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ roomCode: code }),
            });
            if (dailyRes.ok) {
              const { url } = await dailyRes.json();
              await supabase
                .from("rooms")
                .update({ daily_url: url })
                .eq("code", code);
            }
          } catch {
            // Video is optional — carry on regardless
          }

          sessionStorage.setItem(`icst:${code}:role`, "creator");
          router.replace(`/activity-guide?code=${code}`);
          return;
        }

        // 23505 = unique_violation — code collision, retry
        if (insertError.code !== "23505") {
          break;
        }
      }
      setError("Something went wrong setting up your room. Please try again.");
    }

    create();
  }, [router]);

  if (error) {
    return (
      <main className="relative flex flex-1 flex-col items-center justify-center min-h-screen px-8 py-16 gap-10 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute -top-28 -right-28 w-96 h-96 rounded-full opacity-[0.15] pointer-events-none"
          style={{ background: "#48AFF3" }}
        />
        <p className="text-3xl text-black text-center max-w-sm leading-relaxed">
          {error}
        </p>
        <Link
          href="/"
          className="flex items-center justify-center w-full max-w-sm py-5 rounded-3xl bg-white border-2 border-gray-200 text-black text-2xl font-semibold shadow-sm active:scale-95 transition-transform"
        >
          Go Back
        </Link>
      </main>
    );
  }

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center min-h-screen px-8 py-16 gap-10 overflow-hidden">
      {/* Blue decorative circles */}
      <div
        aria-hidden="true"
        className="absolute -top-28 -right-28 w-96 h-96 rounded-full opacity-[0.15] pointer-events-none"
        style={{ background: "#48AFF3" }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-[0.10] pointer-events-none"
        style={{ background: "#48AFF3" }}
      />

      <div className="flex flex-col items-center gap-5 text-center">
        {/* Animated pulsing ring */}
        <div className="relative flex items-center justify-center w-28 h-28">
          <div
            className="absolute w-28 h-28 rounded-full animate-ping opacity-20"
            style={{ background: "#48AFF3" }}
          />
          <div
            className="w-20 h-20 rounded-full"
            style={{ background: "#48AFF3" }}
          />
        </div>
        <p className="text-3xl font-semibold text-black">
          Setting up your room…
        </p>
        <p className="text-xl text-gray-500">This will only take a moment</p>
      </div>
    </main>
  );
}
