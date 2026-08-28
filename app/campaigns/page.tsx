"use client";

import { useEffect, useState } from "react";
import { Search, Compass, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CampaignCard } from "@/components/campaign-card";
import { CampaignCardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EASE, SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Technology", "AI", "Web3", "Education", "Gaming", "Open Source"];

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("featured");

  // Honor ?category= deep links (landing tiles, footer columns)
  useEffect(() => {
    const cat = new URLSearchParams(window.location.search).get("category");
    if (cat && CATEGORIES.includes(cat)) setSelectedCategory(cat);
  }, []);

  const selectCategory = (cat: string) => {
    setSelectedCategory(cat);
    const url = new URL(window.location.href);
    if (cat === "All") url.searchParams.delete("category");
    else url.searchParams.set("category", cat);
    window.history.replaceState(null, "", url);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["campaigns", selectedCategory, searchQuery, sortBy],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (searchQuery) params.append("search", searchQuery);
      if (sortBy) params.append("sort", sortBy);

      const res = await fetch(`/api/campaigns?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    },
  });

  const campaigns = data?.campaigns || [];

  return (
    <Container className="py-12 space-y-8">
      {/* Header */}
      <div className="space-y-3 max-w-2xl">
        <p className="eyebrow">Marketplace</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-fg">
          Explore Campaigns
        </h1>
        <p className="text-[15px] text-fg-muted leading-relaxed">
          Discover and back verified Web3 projects, AI initiatives, and open-source software built on Stellar.
        </p>
      </div>

      {/* Toolbar */}
      <div className="panel p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, story, or keyword…"
              className="field pl-10 pr-4 py-2.5 text-sm"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-4 h-4 text-fg-faint shrink-0" />
            <label className="text-[12px] text-fg-muted shrink-0">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="field w-auto px-3 py-2 text-[13px] cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="trending">Trending</option>
              <option value="newest">Newest</option>
              <option value="ending_soon">Ending Soon</option>
              <option value="highest_funded">Highest Funded</option>
            </select>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => selectCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap border transition-all",
                selectedCategory === cat
                  ? "bg-accent text-fg-on-accent border-transparent"
                  : "bg-surface text-fg-muted border-line hover:text-fg hover:border-line-strong"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CampaignCardSkeleton key={i} />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={<Compass className="w-5 h-5" />}
          title="No campaigns found"
          description="No projects match your filters. Try a different search or category."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
            >
              Clear filters
            </Button>
          }
          className="my-8"
        />
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {campaigns.map((c: any, i: number) => (
              <motion.div
                layout
                key={c.id}
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ ...SPRING, delay: Math.min(i, 8) * 0.045, opacity: { duration: 0.3, ease: EASE } }}
              >
                <CampaignCard campaign={c} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </Container>
  );
}
