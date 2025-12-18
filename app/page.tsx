import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function HomePage() {
  const headersList = await headers(); // ✅ await required
  const pathname = headersList.get("x-pathname") || "";

  if (pathname.startsWith("/admin")) {
    return null;
  }

  redirect("/tables");
}
