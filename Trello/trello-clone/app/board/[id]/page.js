"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function BoardPage({ params }) {
  const { id } = params;

  const [lists, setLists] = useState([]);
  const [title, setTitle] = useState("");

  const fetchLists = async () => {
    const res = await axios.get(`/api/lists?boardId=${id}`);
    setLists(res.data);
  };

  const createList = async () => {
    if (!title) return;

    await axios.post("/api/lists", {
      title,
      boardId: id,
    });

    setTitle("");
    fetchLists();
  };

  useEffect(() => {
    fetchLists();
  }, []);

  return (
    <div className="p-5">
      <h1 className="text-xl font-bold mb-4">Board</h1>

      <div className="flex gap-4 overflow-x-auto">
        {lists.map((list) => (
          <div key={list._id} className="bg-gray-200 p-4 w-64 rounded">
            <h2 className="font-semibold">{list.title}</h2>
          </div>
        ))}

        {/* Add List */}
        <div className="w-64">
          <input
            className="border p-2 w-full"
            placeholder="New list"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button
            onClick={createList}
            className="bg-blue-500 text-white w-full mt-2 p-2"
          >
            Add List
          </button>
        </div>
      </div>
    </div>
  );
}