const mongoose = require("mongoose");
require("dotenv").config();

// Embed Schema
const embedSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    embedData: { type: mongoose.Schema.Types.Mixed, required: true },
    createdBy: { type: String, required: true },
    messageId: { type: String, required: true },
    channelId: { type: String, required: true },
  },
  { timestamps: true }
);

const EmbedModel = mongoose.model("Embed", embedSchema);

async function hasEmbed(key) {
    const existing = await EmbedModel.exists({key});
    return !!existing;
  }

  async function saveEmbed(key, embedData) {
    await EmbedModel.findOneAndUpdate(
      { key },
      { embedData },
      { upsert: true, new: true }
    );
  }

  async function getEmbed(key) {
    const record = await EmbedModel.findOne({ key });
    return record?.embedData || null;
  }

  async function deleteEmbed(key) {
    await EmbedModel.deleteOne({ key });
  }

  async function getAllEmbeds() {
    const records = await EmbedModel.find({});
    return records.map((r) => ({ key: r.key, embedData: r.embedData }));
  }

  module.exports = {
    saveEmbed,
    getEmbed,
    deleteEmbed,
    getAllEmbeds,
    hasEmbed
  }

