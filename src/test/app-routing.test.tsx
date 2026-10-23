import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});

import {products,solutions} from '@/content/site';
it('matches every public page and each product/solution URL',()=>{const router=createRouter({routeTree,context:{queryClient:new QueryClient()}});for(const path of ['/', '/cozumler','/urunler','/scada-yazilimi','/paketler','/hakkimizda','/iletisim','/demo','/saha-yapilandirici','/privacy-policy','/gizlilik','/cerez','/kvkk',...products.map(p=>'/urunler/'+p.slug),...solutions.map(s=>'/cozumler/'+s.slug)]){const matches=router.matchRoutes(path);expect(matches.at(-1)?.routeId,path).not.toBe(rootRouteId);expect(matches.at(-1)?.globalNotFound,path).not.toBe(true);}});
