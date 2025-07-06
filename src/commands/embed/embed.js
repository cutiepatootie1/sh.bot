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
      if (await embedStorage.hasEmbed(name)) {
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
      });
      embedStorage.saveEmbed(name, {
        embed: embed.toJSON(),
        messageId: message.id,
        channelId: interaction.channel.id,
      });
    }
    //END OF CREATE BLOCK

    //EDIT BLOCK
    else if (sub === "edit") {
      if (!(await embedStorage.hasEmbed(name))) {
        return interaction.reply({
          content: `An embed named **${name}** already exists.`,
          ephemeral: true,
        });
      }

      const {
        embed: storedEmbed,
        messageId,
        channelId,
      } = await embedStorage.getEmbed(name);

      const title = interaction.options.getString("title");
      const description = interaction.options.getString("description");
      const color = interaction.options.getString("color");
      const image = interaction.options.getString("image");
      const thumbnail = interaction.options.getString("thumbnail");

      const updatedEmbed = EmbedBuilder.from(storedEmbed);

      if (title) updatedEmbed.setTitle(title);
      if (description) updatedEmbed.setDescription(description);
      if (color) updatedEmbed.setColor(color);
      if (image) updatedEmbed.setImage(image);
      if (thumbnail) updatedEmbed.setThumbnail(thumbnail);

      const channel = await interaction.client.channels.fetch(channelId);
      const message = await channel.messages.fetch(messageId);

      await message.edit({ embeds: [updatedEmbed] });

      embedStorage.saveEmbed(name, {
        embed: updatedEmbed.toJSON(),
        messageId,
        channelId,
      });
      await interaction.reply({
        content: `Embed **${name}** updated.`,
        ephemeral: true,
      });
    }

    else if (sub === "delete") {
      // Fix: Use proper await syntax with parentheses
      if (!(await embedStorage.hasEmbed(name))) {
        return interaction.reply({
          content: `No embed found with name **${name}**.`,
          ephemeral: true,
        });
      }

      try {
        // Fix: Add await here
        const embedData = await embedStorage.getEmbed(name);
        const { messageId, channelId } = embedData;

        // Try to delete the message (with error handling)
        try {
          const channel = await interaction.client.channels.fetch(channelId);
          const message = await safeMessageFetch(channel, messageId);

          if (message) {
            await message.delete();
            console.log(
              `Deleted message ${messageId} from channel ${channelId}`
            );
          } else {
            console.log(`Message ${messageId} not found, skipping deletion`);
          }
        } catch (messageError) {
          console.error("Error deleting message:", messageError);
          // Continue with storage deletion even if message deletion fails
        }

        // Fix: Add await here
        await embedStorage.deleteEmbed(name);

        await interaction.reply({
          content: `Embed **${name}** has been deleted.`,
          ephemeral: true,
        });
      } catch (error) {
        console.error("Error deleting embed:", error);
        await interaction.reply({
          content: `An error occurred while deleting embed **${name}**.`,
          ephemeral: true,
        });
      }
    }

    //embed show block
    else if (sub === "show") {
      if (!(await embedStorage.hasEmbed(name))) {
        return interaction.reply({
          content: `No embed found with name **${name}**.`,
          ephemeral: true,
        });
      }

      const { embed } = await embedStorage.getEmbed(name);

      return interaction.reply({
        embeds: [EmbedBuilder.from(embed)],
      });
    }
  },
};
