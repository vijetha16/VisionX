import { getChatGPTUser } from "./chatgpt-auth";
import { AuthPortal } from "./auth-portal";
import { StartupOS } from "./startup-os";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  if (!user) return <AuthPortal />;
  return <StartupOS user={{ name: user.displayName, email: user.email }} />;
}
