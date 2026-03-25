import { Account } from "appwrite";
import { createAppwriteClient } from "@/lib/appwrite/client";

export function createAccount() {
  const client = createAppwriteClient();
  return new Account(client);
}
