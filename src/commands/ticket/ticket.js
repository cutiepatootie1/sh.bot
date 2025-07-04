const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Generate an embed for tickets -- server owner can edit the embed"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("🎫 Submit a Ticket")
      .setDescription("Click the button below to submit your ticket.")
      .setColor(0x00ae86)
      .setTimestamp();

    const editButton = new ButtonBuilder()
      .setCustomId("edit_ticket_embed")
      .setLabel("Edit")
      .setStyle(ButtonStyle.Secondary);

    const orderButton = new ButtonBuilder()
      .setCustomId("submit_order")
      .setLabel("🛎️order")
      .setStyle(ButtonStyle.Primary);

      // const reportButton = new ButtonBuilder()
      // .setCustomId("submit_report")
      // .setLabel("🛎️order")
      // .setStyle(ButtonStyle.Primary);

      // const othersButton = new ButtonBuilder()
      // .setCustomId("submit_others")
      // .setLabel("🛎️order")
      // .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(editButton, orderButton);

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },
};
