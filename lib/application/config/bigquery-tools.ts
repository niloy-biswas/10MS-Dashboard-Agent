import { tool } from "@langchain/core/tools";
import { BigQuery } from "@google-cloud/bigquery";
import { z } from "zod";

function parseCredentials(raw?: string) {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    console.error("Invalid BigQuery credentials JSON");
    return undefined;
  }
}

export interface BigQueryRuntimeOptions {
  projectId: string;
  location?: string;
  credentialsJson?: string;
}

export function createBigQueryTools(options: BigQueryRuntimeOptions) {
  const location = options.location ?? process.env.BIGQUERY_LOCATION ?? "US";
  const bq = new BigQuery({
    projectId: options.projectId,
    location,
    credentials: parseCredentials(options.credentialsJson),
  });

  const execute_query = tool(
    async ({ query }: { query: string }) => {
      const [rows] = await bq.query({ query, location });
      return JSON.stringify(rows);
    },
    {
      name: "execute_query",
      description: "Execute a SQL query in Google BigQuery",
      schema: z.object({
        query: z.string().describe("The BigQuery SQL query to execute"),
      }),
    }
  );

  const list_tables = tool(
    async () => {
      const [datasets] = await bq.getDatasets();
      const results: string[] = [];
      for (const dataset of datasets) {
        const [tables] = await dataset.getTables();
        tables.forEach((t) => results.push(`${dataset.id}.${t.id}`));
      }
      return results.join("\n");
    },
    {
      name: "list_tables",
      description: "List all available tables in the project",
      schema: z.object({}),
    }
  );

  const describe_table = tool(
    async ({ table_name }: { table_name: string }) => {
      const parts = table_name.replace(/`/g, "").split(".");
      const dataset = parts.length === 3 ? parts[1] : parts[0];
      const table = parts.length === 3 ? parts[2] : parts[1];
      const [metadata] = await bq.dataset(dataset).table(table).getMetadata();
      return JSON.stringify({
        schema: metadata.schema,
        numRows: metadata.numRows,
        description: metadata.description ?? null,
      });
    },
    {
      name: "describe_table",
      description:
        "Get schema and metadata for a specific table",
      schema: z.object({
        table_name: z
          .string()
          .describe("Fully qualified table name: project.dataset.table or dataset.table"),
      }),
    }
  );

  return [execute_query, list_tables, describe_table];
}
