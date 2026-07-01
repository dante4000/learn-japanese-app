import { NextResponse } from "next/server";
import { LalalConfigError, lalalSplit, toLalalStems } from "@/lib/stems/lalal";

export const runtime = "nodejs";

// Starts a multistem split. Returns the task id to poll.
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { source_id, stems } = (await request.json()) as {
      source_id?: string;
      stems?: string[];
    };
    if (!source_id) {
      return NextResponse.json({ error: "Missing source." }, { status: 400 });
    }
    if (!Array.isArray(stems) || toLalalStems(stems).length === 0) {
      return NextResponse.json(
        { error: "Pick at least one stem to extract." },
        { status: 400 },
      );
    }
    const taskId = await lalalSplit(source_id, stems);
    return NextResponse.json({ task_id: taskId });
  } catch (e) {
    const status = e instanceof LalalConfigError ? 500 : 400;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not start the split." },
      { status },
    );
  }
}
