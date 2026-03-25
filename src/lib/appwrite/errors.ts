type AppwriteLikeError = {
  code?: number;
  type?: string;
  message?: string;
};

function toAppwriteLikeError(error: unknown): AppwriteLikeError | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  return error as AppwriteLikeError;
}

export function isAppwriteDocumentNotFoundError(error: unknown) {
  const appwriteError = toAppwriteLikeError(error);
  if (!appwriteError) {
    return false;
  }

  if (appwriteError.code === 404) {
    return true;
  }

  if (typeof appwriteError.type === "string" && appwriteError.type.includes("not_found")) {
    return true;
  }

  if (typeof appwriteError.message !== "string") {
    return false;
  }

  const normalizedMessage = appwriteError.message.toLowerCase();
  return normalizedMessage.includes("requested id") && normalizedMessage.includes("could not be found");
}
