const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const PromoMessage = require('../../data/ticketMessage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('edit-ticket-embed')
    .setDescription('Edit the last ticket embed')
    .addStringOption(opt =>
      opt.setName('description')
        .setDescription('New description')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('image_url')
        .setDescription('New image URL')
        .setRequired(false)),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const record = await PromoMessage.findOne({ guildId }).sort({ _id: -1 });

    if (!record) {
      return interaction.reply({ content: 'No ticket embed found for this server.', flags: MessageFlags.Ephemeral });
    }

    const newDesc = interaction.options.getString('description') ?? record.description;
    const newImage = interaction.options.getString('image_url') ?? record.imageUrl;

    try {
  // Fetch channel and message
  const channel = await interaction.guild.channels.fetch(record.channelId);
  const message = await channel.messages.fetch(record.messageId);

  // Build new embed
  const updatedEmbed = new EmbedBuilder()
    .setDescription(newDesc)
    .setImage(newImage)
    .setColor(0x00AE86)
    .setFooter({ text: `Edited by ${interaction.user.tag}` });

  await message.edit({ embeds: [updatedEmbed] });

  // Save in DB
  record.description = newDesc;
  record.imageUrl = newImage;
  await record.save();

  // Reply once after all awaits
  return interaction.reply({ content: 'ticket embed updated.', flags: MessageFlags.Ephemeral });

} catch (error) {
  console.error(error);
  if (interaction.deferred || interaction.replied) {
    // Interaction already replied, so send followup
    return interaction.followUp({ content: 'Failed to edit the embed. It may have been deleted.', flags: MessageFlags.Ephemeral });
  } else {
    return interaction.reply({ content: 'Failed to edit the embed. It may have been deleted.', flags: MessageFlags.Ephemeral });
  }
}

  }
};
