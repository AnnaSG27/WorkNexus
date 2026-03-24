import { useEffect, useMemo, useState } from "react";

import type { StoredUser } from "./professionals-session";
import { getFavoritesStorageKey } from "./professionals-session";

export interface FavoriteEntry {
  id: string | number;
  savedAt: string;
}

const normalizeFavorites = (value: unknown): FavoriteEntry[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string" || typeof item === "number") {
        return {
          id: item,
          savedAt: new Date(0).toISOString(),
        };
      }

      if (
        item &&
        typeof item === "object" &&
        ("id" in item) &&
        (typeof (item as FavoriteEntry).id === "string" || typeof (item as FavoriteEntry).id === "number")
      ) {
        return {
          id: (item as FavoriteEntry).id,
          savedAt:
            typeof (item as FavoriteEntry).savedAt === "string"
              ? (item as FavoriteEntry).savedAt
              : new Date(0).toISOString(),
        };
      }

      return null;
    })
    .filter((item): item is FavoriteEntry => Boolean(item));
};

export const useProfessionalFavorites = (user: StoredUser | null, canSaveFavorites: boolean) => {
  const [savedFavorites, setSavedFavorites] = useState<FavoriteEntry[]>([]);
  const favoritesStorageKey = getFavoritesStorageKey(user);

  useEffect(() => {
    if (!favoritesStorageKey || !canSaveFavorites) {
      setSavedFavorites([]);
      return;
    }

    try {
      const storedFavorites = localStorage.getItem(favoritesStorageKey);
      if (!storedFavorites) {
        setSavedFavorites([]);
        return;
      }

      const parsedFavorites = JSON.parse(storedFavorites);
      setSavedFavorites(normalizeFavorites(parsedFavorites));
    } catch {
      setSavedFavorites([]);
    }
  }, [favoritesStorageKey, canSaveFavorites]);

  useEffect(() => {
    if (!favoritesStorageKey || !canSaveFavorites) return;
    localStorage.setItem(favoritesStorageKey, JSON.stringify(savedFavorites));
  }, [favoritesStorageKey, canSaveFavorites, savedFavorites]);

  const savedFreelancerIds = useMemo(() => savedFavorites.map((favorite) => favorite.id), [savedFavorites]);

  const toggleFavorite = (id: string | number) => {
    const isSaved = savedFreelancerIds.includes(id);
    const savedAt = new Date().toISOString();

    setSavedFavorites((current) =>
      current.some((favorite) => favorite.id === id)
        ? current.filter((favorite) => favorite.id !== id)
        : [{ id, savedAt }, ...current],
    );

    return {
      saved: !isSaved,
      savedAt,
    };
  };

  const getFavoriteEntry = (id: string | number | undefined) => {
    if (id === undefined) return undefined;
    return savedFavorites.find((favorite) => favorite.id === id);
  };

  return {
    savedFavorites,
    savedFreelancerIds,
    toggleFavorite,
    getFavoriteEntry,
  };
};
