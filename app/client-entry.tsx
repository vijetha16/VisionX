"use client";

import { useSyncExternalStore } from "react";
import { AuthPortal, type DemoUser } from "./auth-portal";
import { StartupOS } from "./startup-os";

const SESSION_KEY = "northstar-demo-session";
const SESSION_EVENT = "northstar-session-change";

function subscribe(callback: () => void) {
  window.addEventListener(SESSION_EVENT, callback);
  return () => window.removeEventListener(SESSION_EVENT, callback);
}
function getSnapshot() { return window.localStorage.getItem(SESSION_KEY) ?? ""; }
function getServerSnapshot() { return ""; }

export function ClientEntry() {
  const session = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const user = session ? JSON.parse(session) as DemoUser : null;
  function saveUser(nextUser: DemoUser) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
    window.dispatchEvent(new Event(SESSION_EVENT));
  }
  function signOut() {
    window.localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event(SESSION_EVENT));
  }
  return user ? <StartupOS user={user} onSignOut={signOut} /> : <AuthPortal onAuthenticated={saveUser} />;
}
