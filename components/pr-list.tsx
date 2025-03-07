"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { getStatusIcon, getTotalTimeSpentOnPR } from "@/utils/helper";
import { PRListProps, PullRequest } from "@/utils/types";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";

export function PRList({ type, username, status, dateRange }: PRListProps) {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [filteredPRs, setFilteredPRs] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const cardPerPage = 10;
  useEffect(() => {
    async function fetchPRs() {
      setLoading(true);
      try {
        const res = await fetch(`/api/prs/${username}?type=${type}`);
        if (!res.ok) {
          return notFound();
        }
        const data = await res.json();
        setPullRequests(data);
      } catch (error) {
        console.error("Failed to fetch PRs:", error);
      }
      setLoading(false);
    }

    fetchPRs();
  }, [username, type]);

  useEffect(() => {
    if (!pullRequests) {
      return notFound();
    }

    const newPullRequests = pullRequests.filter((pr) => {
      if (status !== "all") {
        if (status === "open" && pr.state !== "open") return false;
        if (
          status === "merged" &&
          (pr.state !== "closed" || pr.pull_request.merged_at === null)
        )
          return false;
        if (
          status === "closed" &&
          (pr.state !== "closed" || pr.pull_request.merged_at !== null)
        )
          return false;
      }

      if (dateRange) {
        const prDate = new Date(pr.created_at);
        if (
          (dateRange.from && prDate < dateRange.from) ||
          (dateRange.to && prDate > dateRange.to)
        )
          return false;
      }

      return true;
    });

    setFilteredPRs(
      newPullRequests.slice(page * cardPerPage, (page + 1) * cardPerPage),
    );
  }, [pullRequests, page, dateRange, status]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredPRs.map((pr) => (
        <Card key={pr.id}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {getStatusIcon(pr)}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <a
                    href={pr.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline"
                  >
                    {pr.title}
                  </a>
                </div>
                <div className="text-sm text-muted-foreground">
                  {pr.repository_url.split("/").slice(-1)[0] || "No RepoName"} ·{" "}
                  {format(new Date(pr.created_at), "MMM d, yyyy")}
                </div>
              </div>
              <div>{getTotalTimeSpentOnPR(pr)}</div>
            </div>
          </CardContent>
        </Card>
      ))}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              className={`cursor-pointer ${page === 0 && "opacity-50"}`}
              onClick={() => page > 0 && setPage(page - 1)}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              className={`cursor-pointer ${Math.floor(pullRequests.length / cardPerPage) === page + 1 && "opacity-50"}`}
              onClick={() =>
                Math.floor(pullRequests.length / cardPerPage) > page + 1 &&
                setPage(page + 1)
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
