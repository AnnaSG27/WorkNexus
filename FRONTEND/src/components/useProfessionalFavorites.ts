import { useEffect, useState } from "react";

import type { StoredUser } from "./professionals-session";
import { getFavoritesStorageKey } from "./professionals-session";

export const useProfessionalFavorites = (user: StoredUser | null, canSaveFavorites: boolean) => {
  const [savedFreelancerIds, setSavedFreelancerIds] = useState<Array<string | number>>([]);
  const favoritesStorageKey = getFavoritesStorageKey(user);

  useEffect(() => {
    if (!favoritesStorageKey || !canSaveFavorites) {
      setSavedFreelancerIds([]);
      return;
    }

    try {
      const storedFavorites = localStorage.getItem(favoritesStorageKey);
      if (!storedFavorites) {
        setSavedFreelancerIds([]);
        return;
      }

      const parsedFavorites = JSON.parse(storedFavorites);
      setSavedFreelancerIds(Array.isArray(parsedFavorites) ? parsedFavorites : []);
    } catch {
      setSavedFreelancerIds([]);
    }
  }, [favoritesStorageKey, canSaveFavorites]);

  useEffect(() => {
    if (!favoritesStorageKey || !canSaveFavorites) return;

    localStorage.setItem(favoritesStorageKey, JSON.stringify(savedFreelancerIds));
  }, [favoritesStorageKey, canSaveFavorites, savedFreelancerIds]);

  const toggleFavorite = (id: string | number) => {
    const isSaved = savedFreelancerIds.includes(id);
    setSavedFreelancerIds((current) =>
      current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id],
    );

    return !isSaved;
  };

  return {
    savedFreelancerIds,
    toggleFavorite,
  };
};
