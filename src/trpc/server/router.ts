import { z } from "zod";
import { router, publicProcedure } from "./trpc";

export const appRouter = router({
  userList: publicProcedure.input(z.string()).query(async (opts) => {
    const { input } = opts;
    return `You entered: ${input}`;
  }),
});
// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
