import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { requireAdmin } from "@/lib/admin-auth";
import { isSameOriginRequest } from "@/lib/request-origin";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 2000;
const aliases: Record<string, string[]> = {
  fullName: ["customer name", "name", "full name", "customer", "participant name", "traveller name", "traveler name"],
  phone: ["mobile", "mobile number", "mobile no", "phone", "phone number", "contact", "contact number", "whatsapp", "whatsapp number"],
  email: ["email", "email address", "email id"], interestedTrip: ["interested trip", "trip", "package", "destination", "interested destination", "trek name"],
  travelMonth: ["travel month", "month", "travel date"], source: ["lead source", "source"],
  status: ["status", "lead status"], nextFollowUpAt: ["next follow-up", "follow up", "follow-up date"],
  assignedTo: ["assigned to", "owner", "caller"], notes: ["notes", "remarks", "comment"], city: ["city", "location"],
};
const statuses: Record<string, string> = { new: "NEW", called: "CALLED", "follow up": "FOLLOW_UP", followup: "FOLLOW_UP", interested: "INTERESTED", "quotation sent": "QUOTATION_SENT", confirmed: "CONFIRMED", "not interested": "NOT_INTERESTED", closed: "CLOSED" };

function key(value: unknown) { return String(value ?? "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " "); }
function valueText(value: unknown) {
  if (value && typeof value === "object" && "text" in value) return String((value as { text: unknown }).text ?? "").trim();
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "").trim();
}

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;
  if (!isSameOriginRequest(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size < 1 || file.size > MAX_FILE_BYTES) return Response.json({ error: "Choose a CSV or XLSX file smaller than 2 MB." }, { status: 400 });
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension || !["csv", "xlsx"].includes(extension)) return Response.json({ error: "Only CSV and XLSX files are supported." }, { status: 400 });
    const workbook = new ExcelJS.Workbook();
    const bytes = Buffer.from(await file.arrayBuffer());
    if (extension === "csv") await workbook.csv.read(Readable.from(bytes));
    else await workbook.xlsx.load(bytes as never);
    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 2) return Response.json({ error: "The file has no lead rows." }, { status: 400 });

    const headerMap = new Map<string, number>();
    sheet.getRow(1).eachCell((cell, column) => headerMap.set(key(valueText(cell.value)), column));
    const columns: Record<string, number | undefined> = {};
    for (const [field, names] of Object.entries(aliases)) columns[field] = names.map((name) => headerMap.get(name)).find(Boolean);
    if (!columns.fullName || (!columns.phone && !columns.email)) return Response.json({ error: "The sheet needs Customer Name and either Mobile or Email columns." }, { status: 400 });

    const importResult = await supabaseAdmin.from("crm_lead_imports").insert({ file_name: file.name, imported_by: "Admin" }).select("id").single();
    if (importResult.error) throw importResult.error;
    let imported = 0, skipped = 0, errors = 0;
    const rowErrors: string[] = [];
    const limit = Math.min(sheet.rowCount, MAX_ROWS + 1);
    for (let rowNumber = 2; rowNumber <= limit; rowNumber += 1) {
      const row = sheet.getRow(rowNumber);
      const get = (field: string) => columns[field] ? valueText(row.getCell(columns[field]!).value) : "";
      const fullName = get("fullName").slice(0, 150);
      const phone = get("phone").slice(0, 32);
      const email = get("email").toLowerCase().slice(0, 320);
      const normalizedPhone = phone.replace(/[^0-9]/g, "") || null;
      const normalizedEmail = email || null;
      if (!fullName || (!normalizedPhone && !normalizedEmail)) { skipped += 1; continue; }
      try {
        const customerQuery = normalizedPhone
          ? await supabaseAdmin.from("crm_customers").select("id").eq("normalized_phone", normalizedPhone).maybeSingle()
          : await supabaseAdmin.from("crm_customers").select("id").eq("normalized_email", normalizedEmail!).limit(1).maybeSingle();
        if (customerQuery.error) throw customerQuery.error;
        let customerId = customerQuery.data?.id;
        if (!customerId) {
          const created = await supabaseAdmin.from("crm_customers").insert({ full_name: fullName, phone: phone || null, normalized_phone: normalizedPhone, email: email || null, normalized_email: normalizedEmail, city: get("city").slice(0, 120) || null }).select("id").single();
          if (created.error) throw created.error;
          customerId = created.data.id;
        }
        const rawStatus = key(get("status"));
        const createdLead = await supabaseAdmin.from("crm_leads").insert({
          customer_id: customerId, interested_trip: get("interestedTrip").slice(0, 200) || null,
          travel_month: get("travelMonth").slice(0, 80) || null, source: get("source").slice(0, 100) || "Imported",
          status: statuses[rawStatus] || "NEW", assigned_to: get("assignedTo").slice(0, 100) || null,
          next_follow_up_at: get("nextFollowUpAt") || null, notes: get("notes").slice(0, 3000) || null, import_id: importResult.data.id,
        }).select("id,status").single();
        if (createdLead.error) throw createdLead.error;
        await supabaseAdmin.from("crm_lead_activities").insert({ lead_id: createdLead.data.id, activity_type: "CREATED", to_status: createdLead.data.status, note: "Imported from " + file.name, created_by: "Admin" });
        imported += 1;
      } catch (rowError) {
        errors += 1;
        if (rowErrors.length < 10) rowErrors.push(`Row ${rowNumber}: ${rowError instanceof Error ? rowError.message : "Could not import"}`);
      }
    }
    await supabaseAdmin.from("crm_lead_imports").update({ imported_rows: imported, skipped_rows: skipped, error_rows: errors }).eq("id", importResult.data.id);
    return Response.json({ imported, skipped, errors, rowErrors });
  } catch (error) {
    console.error("CRM lead import failed:", error);
    return Response.json({ error: "Unable to import the lead file." }, { status: 500 });
  }
}
