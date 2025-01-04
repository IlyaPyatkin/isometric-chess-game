import { z } from "zod";

const baseUrl = "http://127.0.0.1:1234";

type StructuredCompletionParams = {
  schema: object;
  prompt?: string;
  systemPrompt?: string;
};
export const getStructuredCompletion = async ({
  schema,
  systemPrompt = "You are an avid chess player.",
  prompt = "Make your move",
}: StructuredCompletionParams) => {
  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "hermes-3-llama-3.1-8b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "response", strict: "true", schema },
      },
      temperature: 0.7,
      max_tokens: 500,
      stream: false,
    }),
  });

  const json = await response.json();
  const choice = json.choices[0];
  const { content } = choice.message;
  // console.log(choice.finish_reason);
  // console.dir(json.choices, { depth: null, colors: true });
  // console.log(content);
  return JSON.parse(content);
};

export const getChessMove = async ({
  possibleMoves,
  ...rest
}: {
  possibleMoves: [string, ...string[]];
} & Omit<StructuredCompletionParams, "schema">) => {
  const zodSchema = z.object({
    move: z.enum(possibleMoves),
  });
  const response = await getStructuredCompletion({
    ...rest,
    schema: {
      type: "object",
      properties: {
        move: {
          type: "string",
          enum: possibleMoves,
          description: "Chess move in format 'from_to' (e.g. 'b1_c3')",
        },
      },
      required: ["move"],
    },
  });

  return zodSchema.parse(response).move;
};

if (import.meta.main) {
  console.dir(await getChessMove({ possibleMoves: ["a1_a2", "b1_b2"] }), {
    depth: null,
  });
}
