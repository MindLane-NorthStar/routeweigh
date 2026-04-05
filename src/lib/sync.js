import { supabase } from "./supabase";

// ============================================
// RouteWeigh Cloud Sync
// Syncs WeighPoints, settings, vehicle, and
// comparison history for logged-in users.
// ============================================

// ---------- WeighPoints ----------

export async function loadWeighPoints(userId) {
  const { data, error } = await supabase
    .from("weighpoints")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data || []).map((wp) => ({
    id: wp.id,
    label: wp.label,
    address: wp.address,
    lat: parseFloat(wp.lat) || 0,
    lng: parseFloat(wp.lng) || 0,
    icon: wp.icon || "📍",
    color: wp.color || "#2E7D52",
  }));
}

export async function saveWeighPoint(userId, wp) {
  const { data, error } = await supabase
    .from("weighpoints")
    .upsert({
      id: wp.id && wp.id.length > 20 ? wp.id : undefined, // Only use existing UUID ids
      user_id: userId,
      label: wp.label,
      address: wp.address,
      lat: wp.lat,
      lng: wp.lng,
      icon: wp.icon,
      color: wp.color,
      sort_order: wp.sort_order || 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWeighPoint(wpId) {
  const { error } = await supabase
    .from("weighpoints")
    .delete()
    .eq("id", wpId);

  if (error) throw error;
}

export async function replaceAllWeighPoints(userId, weighpoints) {
  // Delete existing
  await supabase.from("weighpoints").delete().eq("user_id", userId);

  // Insert new
  if (weighpoints.length > 0) {
    const rows = weighpoints.map((wp, i) => ({
      user_id: userId,
      label: wp.label,
      address: wp.address,
      lat: wp.lat,
      lng: wp.lng,
      icon: wp.icon,
      color: wp.color,
      sort_order: i,
    }));

    const { error } = await supabase.from("weighpoints").insert(rows);
    if (error) throw error;
  }
}

// ---------- Settings ----------

export async function loadSettings(userId) {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) { console.warn("loadSettings error:", error.message); return null; }

  if (!data) return null;

  return {
    fuelPrice: parseFloat(data.fuel_price) || 3.45,
    fuelGrade: data.fuel_grade || "regular",
    mpg: parseFloat(data.mpg) || 26,
    pillowPremium: parseFloat(data.pillow_premium) || 0,
    zipCode: data.zip_code || "",
    autoFuelPrice: data.auto_fuel_price ?? true,
  };
}

export async function saveSettings(userId, settings) {
  const { error } = await supabase
    .from("user_settings")
    .upsert({
      id: userId,
      fuel_price: settings.fuelPrice,
      fuel_grade: settings.fuelGrade,
      mpg: settings.mpg,
      pillow_premium: settings.pillowPremium,
      zip_code: settings.zipCode,
      auto_fuel_price: settings.autoFuelPrice,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}

// ---------- Vehicle ----------

export async function loadVehicle(userId) {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("user_id", userId)
    .eq("is_default", true)
    .maybeSingle();

  if (error) { console.warn("loadVehicle error:", error.message); return null; }

  if (!data) return null;

  return {
    name: data.name || "My Vehicle",
    mpg: parseFloat(data.mpg) || 26,
    fuelGrade: data.fuel_grade || "regular",
  };
}

export async function saveVehicle(userId, vehicle) {
  // Upsert the default vehicle
  const { data: existing } = await supabase
    .from("vehicles")
    .select("id")
    .eq("user_id", userId)
    .eq("is_default", true)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("vehicles")
      .update({
        name: vehicle.name,
        mpg: vehicle.mpg,
        fuel_grade: vehicle.fuelGrade,
      })
      .eq("id", existing.id);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("vehicles")
      .insert({
        user_id: userId,
        name: vehicle.name,
        mpg: vehicle.mpg,
        fuel_grade: vehicle.fuelGrade,
        is_default: true,
      });

    if (error) throw error;
  }
}

// ---------- Comparison History ----------

export async function saveComparison(userId, scenarioA, scenarioB, resultA, resultB, winner) {
  const { error } = await supabase
    .from("comparisons")
    .insert({
      user_id: userId,
      scenario_a: scenarioA,
      scenario_b: scenarioB,
      result_a: resultA,
      result_b: resultB,
      winner,
    });

  if (error) throw error;
}

export async function loadComparisonHistory(userId, limit = 20) {
  const { data, error } = await supabase
    .from("comparisons")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ---------- Full Sync ----------

export async function loadAllUserData(userId) {
  const [weighpoints, settings, vehicle] = await Promise.all([
    loadWeighPoints(userId).catch(() => []),
    loadSettings(userId).catch(() => null),
    loadVehicle(userId).catch(() => null),
  ]);

  return { weighpoints, settings, vehicle };
}
