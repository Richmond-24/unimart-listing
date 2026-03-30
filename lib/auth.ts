
// lib/auth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function getCurrentUserId() {
  const session = await getSession();
  
  if (!session?.user?.id) {
    throw new Error("User not authenticated or user ID missing");
  }
  
  return session.user.id;
}

// Optional: Get user with role
export async function getCurrentUserWithRole() {
  const session = await getSession();
  return session?.user;
}