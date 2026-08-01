"use client";

import { useState, useSyncExternalStore } from "react";
import { AuthPortal, type DemoUser } from "./auth-portal";
import { LandingPage } from "./landing-page";
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
  const [showAuth,setShowAuth]=useState(false);
  const [enteredWorkspace,setEnteredWorkspace]=useState(false);
  const session = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const user = session ? JSON.parse(session) as DemoUser : null;
  function saveUser(nextUser: DemoUser) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
    window.dispatchEvent(new Event(SESSION_EVENT));
    setEnteredWorkspace(true);
  }
  function signOut() {
    window.localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event(SESSION_EVENT));
    setEnteredWorkspace(false);
    setShowAuth(false);
  }
  if(user&&enteredWorkspace)return <StartupOS user={user} onSignOut={signOut}/>;
  if(showAuth&&!user)return <AuthPortal onAuthenticated={saveUser} onBack={()=>setShowAuth(false)}/>;
  return <LandingPage onGetStarted={()=>user?setEnteredWorkspace(true):setShowAuth(true)}/>;
}
