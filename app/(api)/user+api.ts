import { neon } from "@neondatabase/serverless";
import Constants from "expo-constants";

export async function POST(request: Request) {
  const db_url = Constants?.expoConfig?.extra?.databaseUrl
  const sql = neon(`${db_url}`);

  try {
   const { name, email, clerkId } = await request.json();
   if (!name || !email || !clerkId) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const response =  await sql`
      INSERT INTO users(name, email, clerk_id)
      VALUES(${name}, ${email}, ${clerkId})
    `;

    return new Response(JSON.stringify({data: response}), {status: 201,})

  } catch (error) {
   console.error("Error creating user:", error);
   return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
