const {
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  
} = require("discord.js");
const UserTicket = require("../../data/ticketStorage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-update")
    .setDescription("Update the ticket status")
    .addStringOption((opt) =>
      opt.setName("user").setDescription("Target user ID").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("status")
        .setDescription("New status")
        .setRequired(true)
        .addChoices(
          { name: "Order Received", value: "Order Received" },
          { name: "Processing", value: "Processing" },
          { name: "Delivered", value: "Delivered" }
        )
    )
    .addStringOption((opt) =>
      opt
        .setName("payment")
        .setDescription("Payment method (optional)")
        .setRequired(false)
    ),

  async execute(interaction) {
    const userId = interaction.options.getString("user");
    const status = interaction.options.getString("status");
    const payment = interaction.options.getString("payment") || "Not specified";

    const ticket = await UserTicket.findOne({
      guildId: interaction.guild.id,
      userId,
    });
    if (!ticket)
      return interaction.reply({
        content: "Ticket not found.",
        ephemeral: true,
      });

    ticket.status = status;
    await ticket.save();

    const queueChannel = await interaction.guild.channels.fetch(
      "QUEUE_CHANNEL_ID"
    );
    const ticketChannel = await interaction.guild.channels.fetch(
      ticket.channelId
    );

    await queueChannel.send({
      content: `🔁 Ticket for <@${userId}> updated:\n**Status:** ${status}\n**Payment:** ${payment}`,
    });

    if (status === "Delivered") {
      const confirmBtn = new ButtonBuilder()
        .setCustomId(`confirm_order_${userId}`)
        .setLabel("Confirm Order Received")
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder().addComponents(confirmBtn);

      await ticketChannel.send({
        content: `<@${userId}> your order has been marked as delivered. Please confirm below.`,
        components: [row],
      });
    }

    return interaction.reply({
      content: `Ticket updated for <@${userId}>.`,
      ephemeral: true,
    });
  },
};
