import { apiPost } from "@/lib/api";
import type { ClientSignupPayload, ClientSignupResponse } from "@/types/client";

export function signupClient(payload: ClientSignupPayload) {
  return apiPost<ClientSignupResponse>("/clients/signup", payload);
}

export function validateSignup(data: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  if (!data.fullName) throw new Error("full_name_required");
  if (!data.email) throw new Error("email_required");
  if (data.password.length < 8) throw new Error("password_too_short");
  if (data.password !== data.confirmPassword) throw new Error("password_mismatch");
}
