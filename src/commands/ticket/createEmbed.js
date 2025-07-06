const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const AllowedRoles = require("../../data/allowedRoles");
const ticketMessage = require("../../data/ticketMessage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup-ticket")
    .setDescription("Ticket setup commands")
    .addSubcommand((sub) =>
      sub
        .setName("embed")
        .setDescription("Create an embed with image and description")
        .addStringOption((opt) =>
          opt
            .setName("description")
            .setDescription("Embed description")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("image_url")
            .setDescription(
              "Embed image URL, use attachlink command to get valid links"
            )
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("allow-role")
        .setDescription("Allow a role to use /setup-ticket embed")
        .addRoleOption((opt) =>
          opt.setName("role").setDescription("Role to allow").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove-role")
        .setDescription("Removes priveleges from a role")
        .addRoleOption((opt) => 
          opt.setName("role").setDescription("Role to allow").setRequired(true)
        )
    ).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const guildOwnerId = interaction.guild.ownerId;

    // Check if the user is the server owner
    if (userId !== guildOwnerId) {
      return interaction.reply({
        content: "Only the server owner can use this command.",
        flags: 64,
      });
    }

    if (subcommand === "allow-role") {
      const role = interaction.options.getRole("role");
      let record = await AllowedRoles.findOne({ guildId });

      if (!record) {
        record = new AllowedRoles({ guildId, roleIds: [] });
      }

      if (record.roleIds.includes(role.id)) {
        return interaction.reply({
          content: `Role <@&${role.id}> is already allowed.`,
          flags: 64,
        });
      }

      record.roleIds.push(role.id);
      await record.save();

      return interaction.reply({
        content: `Role <@&${role.id}> can now use /create-promo embed.`,
        flags: 64,
      });
    }

    if (subcommand === "embed") {
      // First check if user is owner or in allowed roles
      const record = await AllowedRoles.findOne({ guildId });
      const allowedRoles = record?.roleIds || [];
      const memberRoles = interaction.member.roles.cache;

      const isAllowed = allowedRoles.some((roleId) => memberRoles.has(roleId));

      if (userId !== guildOwnerId && !isAllowed) {
        return interaction.reply({
          content: "You are not allowed to use this command.",
          flags: 64,
        });
      }

      const description = interaction.options.getString("description");
      const imageUrl = interaction.options.getString("image_url");

      const embed = new EmbedBuilder()
        .setDescription(description)
        .setImage(imageUrl)
        .setColor(0x00ae86)
        .setFooter({ text: `Created by ${interaction.user.tag}` });

      const button = new ButtonBuilder()
        .setCustomId("order_button")
        .setLabel("Order")
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(button);

      const sent = await interaction.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true,
      });

      await ticketMessage.create({
        guildId,
        messageId: sent.id,
        channelId: sent.channel.id,
        description,
        imageUrl,
      });
    //   return interaction.reply({ embeds: [embed], components: [row] });
    }

    if (subcommand === "remove-role") {
      const role = interaction.options.getRole("role");
      const record = await AllowedRoles.findOne({ guildId });

      if (!record || !record.roleIds.includes(role.id)) {
        return interaction.reply({
          content: `Role <@&${role.id}> is not in the allowed list.`,
         flags: MessageFlags.Ephemeral,
        });
      }

      record.roleIds = record.roleIds.filter((id) => id !== role.id);
      await record.save();

      return interaction.reply({
        content: `Role <@&${role.id}> has been removed from the allowed list.`,
       flags: MessageFlags.Ephemeral,
      });
    }
  },
};
