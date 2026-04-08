"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ── Decorative clusters ───────────────────────────────────────────────────────

function ClusterTopRight() {
  return (
    <div aria-hidden="true" className="absolute top-0 right-0 pointer-events-none" style={{ width: 240, height: 220, overflow: "visible" }}>
      {[[60,-10],[120,-10],[0,45],[60,45],[120,45],[60,100],[120,100]].map(([x, y], i) => (
        <div key={i} style={{ position: "absolute", left: x, top: y, width: 85, height: 85, borderRadius: "50%", background: "#48AFF3", opacity: 0.28 }} />
      ))}
    </div>
  );
}

function ClusterBottomLeft() {
  return (
    <div aria-hidden="true" className="absolute bottom-0 left-0 pointer-events-none" style={{ width: 200, height: 200, overflow: "visible" }}>
      {[[-20,30],[-20,100],[48,100]].map(([x, y], i) => (
        <div key={i} style={{ position: "absolute", left: x, top: y, width: 85, height: 85, borderRadius: "50%", background: "#48AFF3", opacity: 0.28 }} />
      ))}
    </div>
  );
}

function ClusterBottomRight() {
  return (
    <div aria-hidden="true" className="absolute bottom-0 right-0 pointer-events-none" style={{ width: 160, height: 160, overflow: "visible" }}>
      {[[30,-10],[80,40]].map(([x, y], i) => (
        <div key={i} style={{ position: "absolute", left: x, top: y, width: 85, height: 85, borderRadius: "50%", background: "#48AFF3", opacity: 0.28 }} />
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WaitingRoom() {
  const params  = useParams<{ code: string }>();
  const code    = params.code.toUpperCase();
  const router  = useRouter();

  const [copied,        setCopied]        = useState(false);
  const [partnerJoined, setPartnerJoined] = useState(false);
  const [shareUrl,      setShareUrl]      = useState(`/room/${code}`);

  const partnerJoinedRef = useRef(false);
  const channelRef       = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    setShareUrl(`${window.location.origin}/room/${code}`);
  }, [code]);

  useEffect(() => {
    const channel = supabase.channel(`room:${code}`);
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const count = Object.keys(channel.presenceState()).length;
        if (count >= 2 && !partnerJoinedRef.current) {
          partnerJoinedRef.current = true;
          setPartnerJoined(true);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ role: "creator", joinedAt: Date.now() });
        }
      });

    return () => { channel.unsubscribe(); };
  }, [code]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // silent — clipboard may not be available
    }
  }

  function startActivity() {
    router.replace(`/room/${code}`);
  }

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen px-8 py-16 gap-8 overflow-hidden bg-white">
      <ClusterTopRight />
      <ClusterBottomLeft />
      <ClusterBottomRight />

      {/* ── Room Code ────────────────────────────────────────────────────────── */}
      <h1 className="text-4xl font-black text-black">Room Code</h1>

      <div
        className="flex items-center justify-center px-10 py-5 rounded-2xl select-none"
        style={{ background: "#D6EEFA" }}
        aria-label={`Room code: ${code}`}
      >
        <span className="text-5xl font-black text-black tracking-[0.35em]">{code}</span>
      </div>

      {/* ── Copy link ────────────────────────────────────────────────────────── */}
      <button
        onClick={copyLink}
        className="px-8 py-4 rounded-full text-white text-lg font-semibold active:scale-[0.97] transition-transform"
        style={{ background: "#48AFF3" }}
      >
        {copied ? "Copied!" : "Copy Room Link"}
      </button>

      {/* ── Waiting indicator ────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full animate-bounce"
              style={{ background: "#48AFF3", animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-base text-gray-500">
          {partnerJoined ? "Partner joined! Ready to start." : "Waiting for your partner to join..."}
        </p>
      </div>

      {/* ── Start Activity ───────────────────────────────────────────────────── */}
      <button
        onClick={startActivity}
        disabled={!partnerJoined}
        className="w-full max-w-sm py-5 rounded-full text-white text-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
        style={{ background: "#888" }}
      >
        Start Activity
      </button>
    </main>
  );
}
