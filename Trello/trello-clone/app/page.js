"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

export default function Home() {
  const [boards, setBoards] = useState([]);
  const [title, setTitle] = useState("");

  const fetchBoards = async () => {
    const res = await axios.get("/api/boards");
    setBoards(res.data);
  };

  const createBoard = async () => {
    if (!title) return;

    await axios.post("/api/boards", { title });
    setTitle("");
    fetchBoards();
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Boards</h1>

      <input
        className="border p-2 mr-2"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Board title"
      />

      <button
        onClick={createBoard}
        className="bg-blue-500 text-white px-4 py-2"
      >
        Create
      </button>

      <div className="mt-5">
        {boards.map((board) => (
          <Link href={`/board/${board._id}`} key={board._id}>
            <div className="p-3 border mt-2 cursor-pointer">
              {board.title}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}