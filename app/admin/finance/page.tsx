import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import VendorWorkspace from "./VendorWorkspace";

export const dynamic = "force-dynamic";
export default async function FinancePage() {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  return <VendorWorkspace />;
}
