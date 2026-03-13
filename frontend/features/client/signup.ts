import { apiPost } from "../../lib/api";
import type { ClientSignupPayload, ClientSignupResponse } from "../../types/client";

export async function signupClient(payload: ClientSignupPayload) {
  return apiPost<ClientSignupResponse>("/clients/register-client", payload);
}

export function validateSignup(data: {
  email: string;
  password: string;
  confirmPassword: string;
}) {
  if (!data.email) throw new Error("Email is verplicht");
  if (data.password.length < 8) throw new Error("Password te kort");
  if (data.password !== data.confirmPassword) throw new Error("Passwords komen niet overeen");
}
