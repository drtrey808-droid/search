export function GET() {
  return Response.json({
    ok: true,
    build: "SAB_SEARCH_R3_HEALTH_TEST",
    configured: {
      tavily: !!process.env.TAVILY_API_KEY,
      nvidia: !!process.env.NVIDIA_API_KEY,
      token: !!process.env.LOOKUP_PROXY_TOKEN,
    },
  });
}

export async function POST(request) {
  try {
    const body = await request.json();

    return Response.json({
      ok: true,
      build: "SAB_SEARCH_R3_HEALTH_TEST",
      received: Array.isArray(body?.questions)
        ? body.questions.length
        : 0,
      items: [],
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: String(error?.message || error),
      },
      { status: 400 }
    );
  }
}
