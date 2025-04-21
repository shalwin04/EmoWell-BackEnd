// utils/getUserData.ts
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const getUserData = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("name, emergency_contact")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Supabase user fetch error:", error.message);
    return null;
  }

  console.log("Fetched userData:", data);

  return {
    userId,
    userName: data.name,
    emergencyContact: data.emergency_contact,
  };
};
