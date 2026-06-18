import { useEffect, useMemo, useState } from "react";
import { userAPI } from "../services/user.service";

const emptySearchState = {
  error: "",
  keyword: "",
  loading: false,
  results: [],
};

export const useUserSearch = (
  keyword,
  { minLength = 2, delay = 300, limit = 8 } = {},
) => {
  const normalizedKeyword = useMemo(() => keyword.trim(), [keyword]);
  const hasQuery = normalizedKeyword.length >= minLength;
  const [searchState, setSearchState] = useState(emptySearchState);

  useEffect(() => {
    if (!hasQuery) {
      return undefined;
    }

    let isCurrent = true;

    const timer = window.setTimeout(async () => {
      setSearchState((current) => ({
        ...current,
        error: "",
        keyword: normalizedKeyword,
        loading: true,
      }));

      try {
        const response = await userAPI.searchUsers(normalizedKeyword, 1, limit);
        if (!isCurrent) return;
        setSearchState({
          error: "",
          keyword: normalizedKeyword,
          loading: false,
          results: response.data?.data || [],
        });
      } catch (err) {
        if (!isCurrent) return;
        setSearchState({
          error: err.response?.data?.message || "Unable to search users.",
          keyword: normalizedKeyword,
          loading: false,
          results: [],
        });
      }
    }, delay);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [delay, hasQuery, limit, normalizedKeyword]);

  const isCurrentKeyword = searchState.keyword === normalizedKeyword;

  if (!hasQuery) {
    return { ...emptySearchState, hasQuery };
  }

  return {
    error: isCurrentKeyword ? searchState.error : "",
    hasQuery,
    loading: !isCurrentKeyword || searchState.loading,
    results: isCurrentKeyword ? searchState.results : [],
  };
};
