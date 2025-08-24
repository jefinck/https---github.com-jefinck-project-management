const Task = require("../models/Task");

// ✅ Student submits a task
const submitTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);

    if (!task) return res.status(404).json({ message: "Task not found" });

    task.submissionDate = new Date();
    task.status = "Submitted";
    await task.save();

    res.json({ message: "Task submitted successfully", task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ Check and update overdue tasks (Can be triggered manually or with CRON)
const checkOverdueTasks = async () => {
  const overdueTasks = await Task.find({ status: "Pending", dueDate: { $lt: new Date() } });

  overdueTasks.forEach(async (task) => {
    task.status = "Missing";
    await task.save();
  });

  console.log("Checked & updated overdue tasks");
};

module.exports = { submitTask, checkOverdueTasks };
