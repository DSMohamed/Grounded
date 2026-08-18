import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AskResponse } from "./grounded.types";

export const ask = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ question: z.string().min(1).max(1000) }).parse(data),
  )
  .handler(async ({ data }): Promise<AskResponse> => {
    const { runPipeline } = await import("./grounded.server");
    return runPipeline(data.question);
  });
