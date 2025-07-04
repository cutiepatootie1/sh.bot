// const StockCategory = require("../models/StockCategory");

// module.exports = {
//   async getStock(guildId) {
//     const categories = await StockCategory.find({ guildId });
//     const stockMap = {};
//     for (const cat of categories) {
//       stockMap[cat.name] = cat.items;
//     }
//     return stockMap;
//   },

//   async addCategory(guildId, categoryName) {
//     await StockCategory.findOneAndUpdate(
//       { guildId, name: categoryName },
//       { $setOnInsert: { items: [] } },
//       { upsert: true }
//     );
//   },

//   async addItem(guildId, category, item) {
//     await StockCategory.findOneAndUpdate(
//       { guildId, name: category },
//       { $addToSet: { items: item } },
//       { upsert: true }
//     );
//   },
// };
