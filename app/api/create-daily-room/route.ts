export async function POST(request: Request) {
  const { roomCode } = await request.json();

  const res = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      // Name must be unique and URL-safe; use the app room code as the key
      name: `icst-${roomCode.toLowerCase()}`,
      properties: {
        max_participants: 2,
        enable_screenshare: false,
        enable_chat: false,
        // Room expires 2 hours after creation
        exp: Math.round(Date.now() / 1000) + 2 * 60 * 60,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return Response.json(
      { error: body.error ?? "Failed to create video room" },
      { status: 500 }
    );
  }

  const room = await res.json();
  return Response.json({ url: room.url });
}
