// // //const embedStorage = new Map();

// // //module.exports = embedStorage;

// const mongoose = require("mongoose");
// require("dotenv").config();

// // MongoDB connection
// mongoose.connect(process.env.MONGO_URL, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then(() => console.log("Connected to MongoDB Atlas"))
//   .catch(err => console.error("MongoDB connection error:", err));

// // Embed Schema
// const embedSchema = new mongoose.Schema({
//   key: { type: String, required: true, unique: true },
//   embedData: { type: mongoose.Schema.Types.Mixed, required: true },
// }, { timestamps: true });

// const EmbedModel = mongoose.model("Embed", embedSchema);

// module.exports = {
//   async saveEmbed(key, embedData) {
//     await EmbedModel.findOneAndUpdate(
//       { key },
//       { embedData },
//       { upsert: true, new: true }
//     );
//   },

//   async getEmbed(key) {
//     const record = await EmbedModel.findOne({ key });
//     return record?.embedData || null;
//   },

//   async deleteEmbed(key) {
//     await EmbedModel.deleteOne({ key });
//   },

//   async getAllEmbeds() {
//     const records = await EmbedModel.find({});
//     return records.map(r => ({ key: r.key, embedData: r.embedData }));
//   }
// };
