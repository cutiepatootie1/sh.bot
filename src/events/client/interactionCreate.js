const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
} = require("discord.js");

const embedStorage = require("../../data/embedStorage");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (interaction.isCommand()) {
      const { commandName } = interaction;
      const command = client.commands.get(commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: `Something went wrong executing this command`,
          ephemeral: true,
        });
      }
    }

    function decimalToHexColor(decimal) {
      if (!decimal) return "";
      return "#" + decimal.toString(16).padStart(6, "0").toUpperCase();
    }

    function isValidURL(str) {
      try {
        new URL(str);
        return true;
      } catch {
        return false;
      }
    }

    //FOR EMBED COMMANDS
    if (interaction.isButton()) {
      const [action, group] = interaction.customId.split("_");
      if (action !== "edit") return;

      const name = interaction.customId.slice(`edit_${group}_`.length);
      const entry = embedStorage.get(name);

      if (!entry) {
        return interaction.reply({
          content: `Embed "${name}" not found`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const currentEmbed = EmbedBuilder.from(entry.embed);
      const titleValue = currentEmbed.data.title || "";
      const descriptionValue = currentEmbed.data.description || "";
      const colorValue = currentEmbed.data.color || "";
      const imageValue = currentEmbed.data.image?.url || "";
      const thumbnailValue = currentEmbed.data.thumbnail?.url || "";
      const footerTxtValue = currentEmbed.data.footer.text || "";

      const modal = new ModalBuilder()
        .setCustomId(`modal_edit_embed_${group}_${name}`)
        .setTitle(`Edit ${group} for "${name}"`);

      const components = [];
      const hexColor = decimalToHexColor(colorValue);

      if (group === "basicinfo") {
        components.push(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("titleInput")
              .setLabel("Title")
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
              .setValue(titleValue)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("descriptionInput")
              .setLabel("Description")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(false)
              .setValue(descriptionValue)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("colorInput")
              .setLabel("Color")
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
              .setValue(hexColor)
              .setPlaceholder("Use hex values, e.g., #FF0000")
          )
        );
      }

      if (group === "images") {
        components.push(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("imageInput")
              .setLabel("Main Image URL")
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
              .setValue(imageValue)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("thumbnailInput")
              .setLabel("Thumbnail URL")
              .setRequired(false)
              .setStyle(TextInputStyle.Short)
              .setValue(thumbnailValue)
          )
        );
      }

      if (group === "footer") {
        components.push(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("textInput")
              .setLabel("Footer text")
              .setRequired(false)
              .setStyle(TextInputStyle.Short)
              .setValue(footerTxtValue)
          )
        );
      }

      modal.addComponents(...components);
      await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith("modal_edit_embed_")) {
        const parts = interaction.customId.split("_"); // [modal, edit, embed, title, myEmbed]
        const group = parts[3];
        const name = parts.slice(4).join("_");

        const entry = embedStorage.get(name);
        if (!entry) {
          return interaction.reply({
            content: `Embed "${name}" not found.`,
            ephemeral: true,
          });
        }

        // const newValue = interaction.fields.getTextInputValue(`${field}Input`);

        const updatedEmbed = EmbedBuilder.from(entry.embed);

        if (group === "basicinfo") {
          const title = interaction.fields.getTextInputValue("titleInput");
          const description =
            interaction.fields.getTextInputValue("descriptionInput");
          const color = interaction.fields.getTextInputValue("colorInput");

          if (title) updatedEmbed.setTitle(title);
          if (description) updatedEmbed.setDescription(description);
          if (color) updatedEmbed.setColor(color);
        }

        if (group === "images") {
          const image = interaction.fields.getTextInputValue("imageInput");
          const thumbnail =
            interaction.fields.getTextInputValue("thumbnailInput");

          if (image) updatedEmbed.setImage(image);
          if (thumbnail) updatedEmbed.setThumbnail(thumbnail);
        }

        if (group === "footer") {
          const footerText = interaction.fields.getTextInputValue("textInput");

          // Clear the existing footer first to prevent partial overwrites
          updatedEmbed.setFooter(null);

          if (footerText || iconURL) {
            updatedEmbed.setFooter({
              text: footerText || "", // Discord requires 'text' in footer
              iconURL: interaction.user.displayAvatarURL(),
            });
          }
        }

        const channel = await interaction.client.channels.fetch(
          entry.channelId
        );
        const message = await channel.messages.fetch(entry.messageId);
        await message.edit({ embeds: [updatedEmbed] });

        embedStorage.set(name, { ...entry, embed: updatedEmbed });

        await interaction.reply({
          content: `Embed "${name}" updated.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
    // END OF EMBED COMMANDS

    //FOR TICKET INTERACTIONS
    //EDIT TICKET EMBED
    if (interaction.isButton && interaction.customId === "edit_ticket_embed") {
      if (interaction.user.id !== interaction.guild.ownerId) {
        return interaction.reply({
          content: "Only the server owner can edit this embed.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const modal = new ModalBuilder()
        .setCustomId("edit_ticket_modal")
        .setTitle("Edit Ticket Embed");

      const titleInput = new TextInputBuilder()
        .setCustomId("embed_title")
        .setLabel("Embed Title")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("e.g., 🎫 Submit a Ticket")
        .setRequired(true);

      const descInput = new TextInputBuilder()
        .setCustomId("embed_description")
        .setLabel("Embed Description")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("e.g., Click the button below to submit your ticket.")
        .setRequired(true);

      const firstRow = new ActionRowBuilder().addComponents(titleInput);
      const secondRow = new ActionRowBuilder().addComponents(descInput);

      modal.addComponents(firstRow, secondRow);

      await interaction.showModal(modal);
    }

    if (
      interaction.isModalSubmit &&
      interaction.customId === "modal_edit_ticket_embed"
    ) {
      const title = interaction.fields.getTextInputValue("embed_title");
      const description =
        interaction.fields.getTextInputValue("embed_description");

      const editedEmbed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(0x00ae86)
        .setTimestamp();

      const editButton = new ButtonBuilder()
        .setCustomId("edit_ticket_embed")
        .setLabel("Edit")
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(editButton);

      await interaction.update({
        embeds: [editedEmbed],
        components: [row],
      });

      return;
    }

    //ORDER TICKET INTERACTIONS
    if (interaction.isButton && interaction.customId === "submit_order") {
      const categorySelect = new StringSelectMenuBuilder()
        .setCustomId("ticket_select_category")
        .addOptions(
          {
            label: "roblox items",
            value: "roblox-items",
          },
          {
            label: ""
          }
        );
    }
  },
};
