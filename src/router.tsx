import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    // Failed loads used to look like empty lists. Say so once per distinct error;
    // queries that are nice-to-have opt out with `meta: { quiet: true }`.
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (typeof window === "undefined" || query.meta?.["quiet"]) return;
        toast.error("Some of this page didn't load", { id: `query-error:${error.message}`, description: `${error.message}. Refresh the page or try again in a moment.` });
      },
    }),
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultViewTransition: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  return router;
};
