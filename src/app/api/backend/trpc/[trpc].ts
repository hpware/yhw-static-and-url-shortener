import { createNextApiHandler } from "@trpc/server/adapters/next";
import { appRouter } from "@/trpc/server/router";
// @link https://nextjs.org/docs/api-routes/introduction
export default createNextApiHandler({
  router: appRouter,
  createContext: () => ({}),
});
