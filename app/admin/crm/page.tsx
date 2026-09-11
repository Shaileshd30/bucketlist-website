import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import CrmWorkspace from "./CrmWorkspace";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin");
  return <CrmWorkspace />;
}
