import express from "express";
import Chat from "../models/Chat.js";

const router = express.Router();

// 🟢 Get chat between student & faculty
router.get("/:studentId/:facultyId", async (req, res) => {
  try {
    const { studentId, facultyId } = req.params;
    let chat = await Chat.findOne({ studentId, facultyId });

    if (!chat) {
      chat = new Chat({
        studentId,
        facultyId,
        messages: [],
        unreadCountStudent: 0,
        unreadCountFaculty: 0,
      });
      await chat.save();
    }

    res.json(chat);
  } catch (err) {
    console.error("Error fetching chat:", err);
    res.status(500).json({ error: "Failed to fetch chat" });
  }
});

// 🟢 Send a message
router.post("/:studentId/:facultyId", async (req, res) => {
  const { studentId, facultyId } = req.params;
  const { sender, content } = req.body;

  try {
    let chat = await Chat.findOne({ studentId, facultyId });

    if (!chat) {
      chat = new Chat({
        studentId,
        facultyId,
        messages: [],
        unreadCountStudent: 0,
        unreadCountFaculty: 0,
      });
    }

    chat.messages.push({ sender, content, timestamp: new Date() });
    if (sender === "student") {
      chat.unreadCountFaculty = (chat.unreadCountFaculty || 0) + 1;
      chat.unreadCountStudent = 0;
    } else {
      chat.unreadCountStudent = (chat.unreadCountStudent || 0) + 1;
      chat.unreadCountFaculty = 0;
    }
    await chat.save();

    res.json(chat);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// 🟢 Mark messages as read
router.put("/:studentId/:facultyId/read", async (req, res) => {
  const { studentId, facultyId } = req.params;
  const { reader } = req.body;

  try {
    const chat = await Chat.findOne({ studentId, facultyId });
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (reader === "student") {
      chat.unreadCountStudent = 0;
    } else if (reader === "faculty") {
      chat.unreadCountFaculty = 0;
    }
    await chat.save();

    res.json({ message: "Messages marked as read" });
  } catch (err) {
    console.error("Error marking messages as read:", err);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});

export default router;