const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Displays bot commands"),

  async execute(interaction, client) {
    const commands = interaction.client.commands;

    const embed = new EmbedBuilder()
      .setTitle("Available Bot Commands")
      .setColor(0x00ae86)
      .setFooter({ text: "Use these wisely!" });

    for (const [name, command] of commands) {
      let description = command.data.description || "No description";
      let options = command.data.options
        ?.map((opt) => `• **${opt.name}**: ${opt.description}`)
        .join("\n");

      embed.addFields({
        name: `/${name}`,
        value: options ? `${description}\n${options}` : description,
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed], flags:MessageFlags.Ephemeral });
  },
};
