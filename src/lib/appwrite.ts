"use client";

import { Databases, Query, Client, Account, Storage } from "appwrite";

const endpoint = "https://sgp.cloud.appwrite.io/v1";
const projectId = "69c3a3f10011a71ec4dd";

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

export { client, account, databases, storage };
export const q = Query;
