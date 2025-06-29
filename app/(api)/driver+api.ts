import { neon } from "@neondatabase/serverless";
import Constants from "expo-constants";

export async function GET(request: Request) {
  const db_url = Constants.expoConfig?.extra?.databaseUrl;
  try {
    const sql = neon(`${db_url}`);
    const response = await sql`SELECT * FROM drivers`;

    const data = JSON.stringify(response);

    return Response.json({ data: response });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
