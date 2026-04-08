"use client";

import { useEffect, useRef, useState } from "react";

// ── Icons ─────────────────────────────────────────────────────────────────────

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" width="16" height="16" aria-hidden="true">
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-3.07A7 7 0 0 0 19 11h-2z" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" width="16" height="16" aria-hidden="true">
      <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17V5a3 3 0 0 0-5.81-.17L14.98 11.17zM4.27 3 3 4.27l6.01 6.01V11a3 3 0 0 0 2.99 3c.22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5-2.24-5-5H5a7 7 0 0 0 6 6.93V21h2v-3.07c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="44" height="44" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4z" />
    </svg>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface VideoBubblesProps {
  dailyUrl:         string | null;
  localGlowColor:   string | null;
  remoteGlowColor:  string | null;
}

interface TileProps {
  videoRef:      React.RefObject<HTMLVideoElement | null>;
  muted:         boolean;
  videoActive:   boolean;
  label:         string;
  showMuteToggle: boolean;
  isMicMuted:    boolean;
  onToggleMic:   () => void;
  glowColor:     string | null;
}

// ── Single video tile ─────────────────────────────────────────────────────────

function VideoTile({
  videoRef, muted, videoActive, label,
  showMuteToggle, isMicMuted, onToggleMic, glowColor,
}: TileProps) {
  const TILE_W = 160;
  const TILE_H = 175;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative overflow-hidden rounded-2xl transition-all duration-300"
        style={{
          width:  TILE_W,
          height: TILE_H,
          background: "#1c1c1e",
          border: glowColor
            ? `3px solid ${glowColor}`
            : "2px solid rgba(255,255,255,0.15)",
          boxShadow: glowColor
            ? `0 0 0 4px ${glowColor}35, 0 4px 20px rgba(0,0,0,0.2)`
            : "0 4px 20px rgba(0,0,0,0.2)",
        }}
      >
        {/* Video feed */}
        <video
          ref={videoRef as React.RefObject<HTMLVideoElement>}
          autoPlay
          playsInline
          muted={muted}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: videoActive ? "block" : "none" }}
        />

        {/* Placeholder */}
        {!videoActive && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <PersonIcon />
          </div>
        )}

        {/* Mic toggle — self-view only */}
        {showMuteToggle && (
          <button
            onClick={onToggleMic}
            aria-label={isMicMuted ? "Unmute microphone" : "Mute microphone"}
            className="absolute bottom-2 right-2 flex items-center justify-center rounded-full transition-colors active:scale-90"
            style={{
              width: 32, height: 32,
              background: isMicMuted ? "#F76C6C" : "rgba(0,0,0,0.55)",
            }}
          >
            {isMicMuted ? <MicOffIcon /> : <MicIcon />}
          </button>
        )}
      </div>

      <p className="text-xs font-medium text-gray-400 select-none">{label}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function VideoBubbles({ dailyUrl, localGlowColor, remoteGlowColor }: VideoBubblesProps) {
  const callRef         = useRef<any>(null);
  const initialisedRef  = useRef(false);
  const localVideoRef   = useRef<HTMLVideoElement>(null);
  const remoteVideoRef  = useRef<HTMLVideoElement>(null);

  const [localVideoActive,  setLocalVideoActive]  = useState(false);
  const [remoteVideoActive, setRemoteVideoActive] = useState(false);
  const [isMicMuted,        setIsMicMuted]        = useState(false);

  useEffect(() => {
    if (!dailyUrl || initialisedRef.current) return;
    initialisedRef.current = true;

    async function setup() {
      try {
        const dailyModule = await import("@daily-co/daily-js");
        const factory: any = dailyModule.default ?? dailyModule;

        const call = factory.createCallObject({ audioSource: true, videoSource: true });
        callRef.current = call;

        function attachTrack(participant: any, el: HTMLVideoElement | null) {
          if (!el) return;
          const track = participant?.tracks?.video?.persistentTrack;
          if (track && participant?.tracks?.video?.state === "playable") {
            el.srcObject = new MediaStream([track]);
          } else {
            el.srcObject = null;
          }
        }

        function isPlayable(p: any) {
          return p?.tracks?.video?.state === "playable";
        }

        call.on("joined-meeting", () => {
          const local = call.participants().local;
          attachTrack(local, localVideoRef.current);
          setLocalVideoActive(isPlayable(local));
        });

        call.on("participant-joined", ({ participant }: any) => {
          if (participant.local) return;
          attachTrack(participant, remoteVideoRef.current);
          setRemoteVideoActive(isPlayable(participant));
        });

        call.on("participant-updated", ({ participant }: any) => {
          if (participant.local) {
            attachTrack(participant, localVideoRef.current);
            setLocalVideoActive(isPlayable(participant));
          } else {
            attachTrack(participant, remoteVideoRef.current);
            setRemoteVideoActive(isPlayable(participant));
          }
        });

        call.on("participant-left", ({ participant }: any) => {
          if (!participant.local) {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            setRemoteVideoActive(false);
          }
        });

        await call.join({ url: dailyUrl });
      } catch (err) {
        console.error("[VideoBubbles] setup failed:", err);
      }
    }

    setup();

    return () => {
      const c = callRef.current;
      callRef.current = null;
      if (c) c.leave().catch(() => {}).finally(() => c.destroy().catch(() => {}));
    };
  }, [dailyUrl]);

  async function toggleMic() {
    const call = callRef.current;
    if (!call) return;
    const next = !isMicMuted;
    try {
      await call.setLocalAudio(!next);
      setIsMicMuted(next);
    } catch { /* ignore */ }
  }

  if (!dailyUrl) return null;

  return (
    <>
      {/* Self-view — left */}
      <div
        className="fixed top-1/2 -translate-y-1/2 left-3 z-40 pointer-events-auto"
        style={{ willChange: "transform" }}
      >
        <VideoTile
          videoRef={localVideoRef}
          muted={true}
          videoActive={localVideoActive}
          label="You"
          showMuteToggle={true}
          isMicMuted={isMicMuted}
          onToggleMic={toggleMic}
          glowColor={localGlowColor}
        />
      </div>

      {/* Remote view — right */}
      <div
        className="fixed top-1/2 -translate-y-1/2 right-3 z-40 pointer-events-auto"
        style={{ willChange: "transform" }}
      >
        <VideoTile
          videoRef={remoteVideoRef}
          muted={false}
          videoActive={remoteVideoActive}
          label="Partner"
          showMuteToggle={false}
          isMicMuted={false}
          onToggleMic={() => {}}
          glowColor={remoteGlowColor}
        />
      </div>
    </>
  );
}
