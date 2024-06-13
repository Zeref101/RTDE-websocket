import { Socket } from "socket.io";
import Document from "./model/Document.model";
import mongoose from "mongoose";
import { connectToDB } from "./db";

const io = require("socket.io")(5000, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

interface SendChangesProps {
  updatedContent: string;
  docId: string;
}

interface IDocument {
  content: string;
  title: string;
  owner: mongoose.Schema.Types.ObjectId;
  lastModified: Date;
}

io.on("connection", async (socket: Socket) => {
  console.log("Client connected", socket.id);

  socket.on("get-document", async (docId: string) => {
    const dataContent = await findDocument(docId);
    socket.join(docId);
    if (dataContent) {
      socket.emit("load-document", dataContent.content);
      console.log(`Document ${docId} loaded for socket ${socket.id}`);
    }
    const room = io.sockets.adapter.rooms.get(docId);
    if (room) {
      console.log(`Room ${docId} has ${room.size} sockets`);
    }
  });

  socket.on("send-changes", ({ updatedContent, docId }: SendChangesProps) => {
    console.log(`Received changes for document ${docId}: `, updatedContent);
    socket.broadcast.to(docId).emit("receive-changes", updatedContent);
    console.log(
      `Changes broadcasted to room ${docId} from socket ${socket.id}`
    );
  });

  socket.on(
    "save-doc",
    async ({ docId, content }: { docId: string; content: string }) => {
      if (!(docId && content)) return;
      const doc = await saveDocument(docId, content);
      if (doc !== undefined) {
        console.log(`Content saved for ${docId}`);
      } else {
        console.log(`Failed to save content for ${docId}`);
      }
    }
  );

  console.log("connected");
});

async function findDocument(docId: string): Promise<IDocument | null> {
  try {
    connectToDB();
    const data = await Document.findById(docId);
    if (data) {
      return data;
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function saveDocument(docId: string, content: string) {
  try {
    connectToDB();
    const document = await Document.findById(docId);
    if (document) {
      document.content = content;
      document.lastModified = new Date();
      await document.save();
      console.log(`Document ${docId} saved successfully.`);
    } else {
      console.log(`Document ${docId} not found.`);
    }
  } catch (error) {
    console.error(`Error saving document ${docId}: `, error);
  }
}
