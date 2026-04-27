import { connectDB } from "@/lib/db";
import List from "@/models/List";

export async function POST(req) {
  await connectDB();
  const body = await req.json();

  const list = await List.create({
    title: body.title,
    boardId: body.boardId,
  });

  return Response.json(list);
}

export async function GET(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const boardId = searchParams.get("boardId");

  const lists = await List.find({ boardId });

  return Response.json(lists);
}