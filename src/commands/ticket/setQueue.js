const {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require("discord.js");
const QueueConfig = require("../../data/configs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("set-queue-ch")
    .setDescription("Set the ticket queue channel")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel where tickets will be posted")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildOwnerId = interaction.guild.ownerId;
    const guildId = interaction.guild.id;

    // Only allow the owner to use this command
    if (userId !== guildOwnerId) {
      return interaction.reply({
        content: "Only the server owner can set the queue channel.",
        ephemeral: true,
      });
    }

    const selectedChannel = interaction.options.getChannel("channel");

    await QueueConfig.findOneAndUpdate(
      { guildId },
      { queueChannelId: selectedChannel.id },
      { upsert: true }
    );

    return interaction.reply({
      content: `✅ Queue channel set to <#${selectedChannel.id}>`,
      ephemeral: true,
    });
  },
};
