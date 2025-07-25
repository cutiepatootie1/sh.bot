const {
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require("discord.js");
const UserTicket = require("../../data/ticketStorage");
const Queueconfig = require("../../data/configs");
const allowedRoles = require("../../data/allowedRoles");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-update")
    .setDescription("Update the ticket status")
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("Ticket owner's user")
        .setRequired(true)
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
        .setName("messageid")
        .setDescription("Required in the case of repeat orders")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("payment")
        .setDescription("Payment method (optional)")
        .setRequired(false)
    ),

  async execute(interaction) {
    const member = interaction.member;

    // Permission check: allow server owner or users with allowed roles
    if (interaction.user.id !== interaction.guild.ownerId) {
      const config = await allowedRoles.findOne({
        guildId: interaction.guild.id,
      });

      if (!config || !config.roleIds.length) {
        return interaction.reply({
          content:
            "❌ You don’t have permission to use this command (no roles allowed).",
          ephemeral: true,
        });
      }

      const hasPermission = member.roles.cache.some((role) =>
        config.roleIds.includes(role.id)
      );
      if (!hasPermission) {
        return interaction.reply({
          content: "❌ You don’t have permission to use this command.",
          ephemeral: true,
        });
      }
    }

    // 👇 Proceed with command logic if permission passed
    const user = interaction.options.getUser("user");
    const status = interaction.options.getString("status");
    const messageid = interaction.options.getString("messageid");

    const ticket = await UserTicket.findOne({
      guildId: interaction.guild.id,
      userId: user.id,
      ticketMessageId: messageid,
    });

    const payment = interaction.options.getString("payment") || ticket?.payment;

    if (!ticket || !ticket.ticketMessageId) {
      return interaction.reply({
        content: "❌ Ticket or queue message not found.",
        ephemeral: true,
      });
    }

    ticket.status = status;
    ticket.payment = payment;
    await ticket.save();

    const queueconfig = await Queueconfig.findOne({
      guildId: interaction.guildId,
    });
    if (!queueconfig || !queueconfig.queueChannelId) {
      return interaction.reply({
        content: "❗ Queue channel not configured. Use `/set-queue-ch`.",
        ephemeral: true,
      });
    }

    const queueChannel = await interaction.guild.channels
      .fetch(queueconfig.queueChannelId)
      .catch(() => null);
    if (!queueChannel) {
      return interaction.reply({
        content: "❗ Cannot access the queue channel.",
        ephemeral: true,
      });
    }

    const queueMessage = await queueChannel.messages
      .fetch(ticket.ticketMessageId)
      .catch(() => null);
    if (!queueMessage) {
      return interaction.reply({
        content: "⚠️ Queue message not found or was deleted.",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("🧾 Order Ticket")
      .addFields(
        { name: "User", value: `<@${ticket.userId}>`, inline: true },
        { name: "Item", value: ticket.item, inline: true },
        { name: "Quantity", value: `${ticket.quantity}`, inline: true },
        { name: "Status", value: status, inline: true },
        { name: "Payment", value: payment, inline: true }
      )
      .setColor(
        status === "Delivered"
          ? "Green"
          : status === "Processing"
          ? "Yellow"
          : "Orange"
      )
      .setFooter({ text: `Updated by ${interaction.user.tag}` });

    await queueMessage.edit({ embeds: [embed] });

    const ticketChannel = await interaction.guild.channels
      .fetch(ticket.channelId)
      .catch(() => null);

    if (ticketChannel && status === "Delivered") {
      const confirmBtn = new ButtonBuilder()
        .setCustomId(`confirm_order_${user.id}`)
        .setLabel("Confirm Order Received")
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder().addComponents(confirmBtn);

      await ticketChannel.send({
        content: `<@${user.id}>, your order has been marked as **delivered**. Please confirm below.`,
        components: [row],
      });
    }

    return interaction.reply({
      content: `✅ Ticket for <@${user.id}> updated.`,
      ephemeral: true,
    });
  },
};
