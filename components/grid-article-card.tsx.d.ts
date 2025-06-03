import type { Article } from "@/lib/types";
import * as React from "react";

declare type GridArticleCardProps = {
  article: Article;
  isBiasedMode: boolean;
  isBookmarked: boolean;
  toggleBookmark: (id: string) => void;
  variant: "hero" | "title-only" | "image-overlay" | "horizontal" | "large" | "vertical";
};

declare export function GridArticleCard(props: GridArticleCardProps): React.ReactElement;
