import { useEffect, useMemo } from "react";

export const useObjectUrls = (files = []) => {
  const urls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );

  useEffect(
    () => () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    },
    [urls],
  );

  return urls;
};

