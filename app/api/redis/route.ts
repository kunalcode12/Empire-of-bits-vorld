import { NextResponse } from "next/server";
import { createClient } from "redis";

// Create a singleton Redis client
let client: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
      // If you want to use a specific database number (0-15):
      // database: 0,
    });

    client.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    await client.connect();
  }

  return client;
}

export async function POST(request: Request) {
  let redisClient;

  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Get Redis client (reuses existing connection)
    redisClient = await getRedisClient();

    // Store wallet address with timestamp
    const timestamp = new Date().toISOString();
    await redisClient.set(`wallet:${walletAddress}`, timestamp);

    // Add to a set of all wallets
    await redisClient.sAdd("wallets", walletAddress);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error storing wallet in Redis:", error);
    return NextResponse.json(
      { success: false, error: "Failed to store wallet address" },
      { status: 500 }
    );
  }
  // Don't disconnect - reuse the connection for future requests
}
