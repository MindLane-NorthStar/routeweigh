import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        // Check if previously chose guest mode
        const guestMode = localStorage.getItem("routeweigh_guest");
        if (guestMode === "true") setIsGuest(true);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session) setIsGuest(false);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email, password, displayName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem("routeweigh_guest");
  }, []);

  const continueAsGuest = useCallback(() => {
    setIsGuest(true);
    localStorage.setItem("routeweigh_guest", "true");
  }, []);

  const upgradeFromGuest = useCallback(() => {
    setIsGuest(false);
    localStorage.removeItem("routeweigh_guest");
  }, []);

  return {
    user,
    loading,
    isGuest,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    continueAsGuest,
    upgradeFromGuest,
  };
}
