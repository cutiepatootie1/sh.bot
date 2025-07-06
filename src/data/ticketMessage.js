const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  messageId: { type: String, required: true },
  channelId: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
});

module.exports = mongoose.model('TicketMessage', ticketMessageSchema, 'ticket-setups');
