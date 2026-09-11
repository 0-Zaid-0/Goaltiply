import { NextRequest, NextResponse } from "next/server";
import { AccountSnapshot, categoryBreakdown } from "@/lib/mockData";

// This route is the seam where the real Budget MCP + Google Sheets API
// integration plugs in. Today it just validates the Sheet ID and returns
// a plausible-looking URL — no real Sheets write happens. A real
// implementation would:
//   1. Look up (or receive from MCP) an OAuth/service-account credential
//      scoped to this sheetId.
//   2. Call the Sheets API (values.update / values.append) to write the
//      account's transactions + budget breakdown into it.
//   3. Return the same shape below so the frontend needs no changes.

type ExportRequest = {
  sheetId: string;
  account: AccountSnapshot;
};

type ExportResponse = {
  url: string;
  syncedAt: string;
  rowsWritten: number;
};

function isPlausibleSheetId(id: string) {
  // Real Google Sheet IDs are long alphanumeric strings (with - and _)
  // pulled from the sheet's URL. Loose check, just to catch obvious typos.
  return /^[a-zA-Z0-9_-]{20,60}$/.test(id.trim());
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ExportRequest;

  if (!body?.sheetId?.trim()) {
    return NextResponse.json({ error: "sheetId is required" }, { status: 400 });
  }
  if (!isPlausibleSheetId(body.sheetId)) {
    return NextResponse.json(
      { error: "That doesn't look like a valid Google Sheet ID." },
      { status: 400 }
    );
  }
  if (!body?.account) {
    return NextResponse.json({ error: "account is required" }, { status: 400 });
  }

  const breakdown = categoryBreakdown(body.account);

  const result: ExportResponse = {
    url: `https://docs.google.com/spreadsheets/d/${body.sheetId.trim()}/edit`,
    syncedAt: new Date().toISOString(),
    rowsWritten: breakdown.length + body.account.transactions.length,
  };

  return NextResponse.json(result);
}
