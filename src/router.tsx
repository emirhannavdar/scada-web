import {saveHomePosition} from "./lib/home-position";
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  router.subscribe("onBeforeNavigate", ({fromLocation,toLocation}) => {
    if(fromLocation?.pathname === "/" && toLocation.pathname !== "/") saveHomePosition();
  });

  return router;
};

declare module '@tanstack/react-router' { interface Register {router:ReturnType<typeof getRouter>} }
