const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true }
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  items: [itemSchema]
});

const shopCatalogSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  categories: [categorySchema]
});

module.exports = mongoose.model('ShopCatalog', shopCatalogSchema, 'catalog');
