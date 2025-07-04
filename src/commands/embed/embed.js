const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ModalBuilder,
  ActionRowBuilder,
  ButtonStyle,
  AttachmentBuilder,
  MessageFlags,
} = require("discord.js");

const embedStorage = require("../../data/embedStorage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Create and edit an embed")
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Create a new embed")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("embed name").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("edit")
        .setDescription("edit an embed")
        .addStringOption((opt) =>
          opt.setName("title").setDescription("edit title")
        )
        .addStringOption((opt) =>
          opt.setName("description").setDescription("edit embed description")
        )
        .addStringOption((opt) =>
          opt
            .setName("image")
            .setDescription("edit image. this appears below description")
        )
        .addStringOption((opt) =>
          opt.setName("thumbnail").setDescription("edit thumbnail")
        )
        .addStringOption((opt) =>
          opt
            .setName("color")
            .setDescription("sets embed color, use HEX values")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("delete a named embed")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Embed name").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("show")
        .setDescription("displays the embed on the current channel")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("embed name").setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const name = interaction.options.getString("name");

    if (sub === "create") {
      if (embedStorage.has(name)) {
        return interaction.reply({
          content: `An embed named **${name}** already exists.`,
          ephemeral: true,
        });
      }
      const createdAt = Date.now();

      const embed = new EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle("Untitled")
        .setDescription("No Description set.")
        .setColor("#2F3136")
        .setFooter({
          text: `Created at: ${new Date(createdAt).toLocaleString()}`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`edit_basicinfo_${name}`)
          .setLabel("Edit basic info (title, description, color")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`edit_images_${name}`)
          .setLabel("Edit images")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`edit_footer_${name}`)
          .setLabel("Edit footer")
          .setStyle(ButtonStyle.Secondary)
      );

      const unix = Math.floor(createdAt / 1000);
      const message = await interaction.reply({
        content: `Embed "**${name}**" is created at <t:${unix}:F>`,
        embeds: [embed],
        components: [row],
        fetchReply: true,
      });
      embedStorage.set(name, {
        embed,
        messageId: message.id,
        channelId: message.channel.id,
      });
    }
    //edit block
    else if (sub === "edit") {
      if (!embedStorage.has(name)) {
        return interaction.reply({
          content: `No embed found with this name: **${name}.`,
          ephemeral: true,
        });
      }

      const { embed, messageId, channelId } = embedStorage.get(name);

      const title = interaction.options.getString("title");
      const description = interaction.options.getString("description");
      const color = interaction.options.getString("color");

      const updatedEmbed = EmbedBuilder.from(JSON.parse(JSON.stringify(embed)));

      if (title) updatedEmbed.setTitle(title);
      if (description) updatedEmbed.setDescription(description);
      if (color) updatedEmbed.setColor(color);

      

      const channel = await interaction.client.channels.fetch(channelId);
      const message = await channel.messages.fetch(messageId);

      await message.edit({ embeds: [updatedEmbed] });

      embedStorage.set(name, { embed: updatedEmbed, messageId, channelId });
      await interaction.reply({
        content: `Embed **${name}** updated.`,
        ephemeral: true,
      });
    }
    //embed delete block
    else if (sub === "delete") {
      if (!embedStorage.has(name)) {
        return interaction.reply({
          content: `No embed found with name **${name}**.`,
          ephemeral: true,
        });
      }

      const { messageId, channelId } = embedStorage.get(name);
      const channel = await interaction.client.channels.fetch(channelId);
      const message = await channel.messages.fetch(messageId);

      await message.delete();
      embedStorage.delete(name);

      await interaction.reply({
        content: `Embed **${name}** has been deleted.`,
        ephemeral: true,
      });
    }
    //embed show block
    else if (sub === "show") {
      if (!embedStorage.has(name)) {
        return interaction.reply({
          content: `No embed found with name **${name}**.`,
          ephemeral: true,
        });
      }

      const { embed } = embedStorage.get(name);

      return interaction.reply({
        embeds: [EmbedBuilder.from(embed)],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
