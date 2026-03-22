export interface StoredUser {
  id?: string | number;
  email?: string;
  username?: string;
  userType?: string;
}

export const getStoredUser = (): StoredUser | null => {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? (JSON.parse(storedUser) as StoredUser) : null;
  } catch {
    return null;
  }
};

export const canUseClientFeatures = (user: StoredUser | null) =>
  Boolean(user) && (!user?.userType || user.userType === "cliente");

export const getFavoritesStorageKey = (user: StoredUser | null) => {
  if (!user) return null;

  const userIdentifier = user.id ?? user.email ?? user.username;
  return userIdentifier ? `favorite-freelancers:${String(userIdentifier)}` : null;
};
