const mongoose = require('mongoose');

const userTicketSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String },
  item: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: 'Order Received' }, // For queue system later
  payment: {type: String},
  channelId: {type: String},
  ticketMessageId: {type: String}
});

module.exports = mongoose.model('UserTicket', userTicketSchema, 'tickets');
