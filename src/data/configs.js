const mongoose = require("mongoose");

const queueConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  queueChannelId: { type: String, required: true },
});

module.exports = mongoose.model("QueueConfig", queueConfigSchema);
