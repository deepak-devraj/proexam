import { connectDB } from "@/lib/db";
import Card from "@/models/Card";

export async function POST(req) {
  await connectDB();
  const body = await req.json();

  const card = await Card.create({
    text: body.text,
    listId: body.listId,
  });

  return Response.json(card);
}

export async function GET(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const listId = searchParams.get("listId");

  const cards = await Card.find({ listId });

  return Response.json(cards);
}