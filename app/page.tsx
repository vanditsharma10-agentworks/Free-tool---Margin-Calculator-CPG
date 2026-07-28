import { redirect } from "next/navigation";
import { PATH } from "@/lib/content";

// This standalone service hosts one page: the calculator, at its real site path
// (/tools/retail-margin-calculator) so the route matches the main site and
// merging needs no structural change. Root just forwards there.
export default function RootPage() {
  redirect(PATH);
}
