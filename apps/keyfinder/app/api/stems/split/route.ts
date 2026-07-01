import { NextResponse } from "next/server";
import { LalalConfigError, lalalSplitStems, toLalalStems } from "@/lib/stems/lalal";

export const runtime = "nodejs";

// Starts one stem_separator task per requested stem. Returns the task ids.
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
    const taskIds = await lalalSplitStems(source_id, stems);
    return NextResponse.json({ task_ids: taskIds });
  } catch (e) {
    const status = e instanceof LalalConfigError ? 500 : 400;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not start the split." },
      { status },
    );
  }
}
