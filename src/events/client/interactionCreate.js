const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");

const embedStorage = require("../../data/embedStorage");
const ShopCatalog = require("../../data/shopCatalog");
const config = require("../../data/configs");
const ticketStorage = require("../../data/ticketStorage");

async function safeMessageFetch(channel, messageId) {
  try {
    return await channel.messages.fetch(messageId);
  } catch (error) {
    if (error.code === 10008) {
      // Message not found
      return null;
    }
    throw error; // Re-throw other errors
  }
}

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
          flags: MessageFlags.Ephemeral,
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
    if (interaction.isButton()) {
      console.log("Button Clicked:", interaction.customId);
    }
    /***
     * order button shit
     */

    if (interaction.isButton() && interaction.customId === "order_button") {
      try {
        const catalog = await ShopCatalog.findOne({
          guildId: interaction.guild.id,
        });

        if (!catalog || catalog.categories.length === 0) {
          return interaction.reply({
            content:
              "No catalog is set up yet, contact owner or staff to raise concern",
          });
        }

        const options = catalog.categories.map((cat) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(cat.name)
            .setValue(`cat:${cat.name}`)
        );

        const menu = new StringSelectMenuBuilder()
          .setCustomId("select_category")
          .setPlaceholder("Choose a category")
          .addOptions(options);

        const row = new ActionRowBuilder().addComponents(menu);

        return interaction.reply({
          content: "🛍️ Select a category:",
          components: [row],
          ephemeral: true,
        });
      } catch (err) {
        console.error("Failed to handle order_button", err);
        if (!interaction.replied && !interaction.deferred) {
          return interaction.reply({
            content: "An error occurred. Please try again later.",
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    }

    if (
      interaction.isButton() &&
      interaction.customId.startsWith("confirm_order_")
    ) {
      const userId = interaction.customId.slice("confirm_order_".length);
      console.log("UserId sliced:", userId);

      console.log("Button clicker: ", interaction.user.id);
      if (interaction.user.id !== userId) {
        return interaction.reply({
          content: "❌ Only the ticket owner can confirm this order.",
          ephemeral: true,
        });
      }

      try {
        // ✅ Immediately defer reply so Discord doesn't timeout
        await interaction.deferReply({ ephemeral: true });

        const updatedTicket = await ticketStorage.findOneAndUpdate(
          {
            guildId: interaction.guild.id,
            userId: interaction.user.id,
            status: "Delivered",
          },
          { status: "Confirmed" },
          { new: true }
        );

        if (!updatedTicket) {
          return interaction.editReply({
            content: "⚠️ No matching delivered ticket found.",
          });
        }

        const ticketChannel = await interaction.guild.channels
          .fetch(updatedTicket.channelId)
          .catch(() => null);

        if (!ticketChannel || !ticketChannel.isTextBased()) {
          return interaction.editReply({
            content: "⚠️ Ticket channel not found or invalid.",
          });
        }

        const ownerId = interaction.guild.ownerId;

        await ticketChannel.send({
          content: `<@${ownerId}> 📨 Order confirmed by <@${interaction.user.id}>!\n**This channel will be deleted in 1 hour.**`,
        });

        await interaction.editReply({
          content: "✅ Your order has been confirmed!",
        });

        setTimeout(async () => {
          const channel = await interaction.guild.channels
            .fetch(updatedTicket.channelId)
            .catch(() => null);
          if (channel) await channel.delete().catch(console.error);
        }, 3600000); // 1 hour
      } catch (err) {
        console.error("Error during confirm_order button:", err);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "Something went wrong while confirming. Please try again.",
            ephemeral: true,
          });
        }
      }
    }

    //FOR EMBED COMMANDS
    if (interaction.isButton()) {
      const [action, group] = interaction.customId.split("_");
      if (action !== "edit") return;

      const name = interaction.customId.slice(`edit_${group}_`.length);
      // const entry = embedStorage.getEmbed(name);
      const { embed: storedEmbed } = await embedStorage.getEmbed(name);
      if (!storedEmbed) {
        return interaction.reply({
          content: `Embed "${name}" not found`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const currentEmbed = EmbedBuilder.from(storedEmbed);
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

        const { embed: storedEmbed } = await embedStorage.getEmbed(name);
        if (!storedEmbed) {
          return interaction.reply({
            content: `Embed "${name}" not found`,
            flags: MessageFlags.Ephemeral,
          });
        }

        // const newValue = interaction.fields.getTextInputValue(`${field}Input`);

        const updatedEmbed = EmbedBuilder.from(storedEmbed);

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

        try {
          const embedData = await embedStorage.getEmbed(name);

          if (!embedData) {
            return interaction.reply({
              content: `Embed "${name}" not found`,
              flags: MessageFlags.Ephemeral,
            });
          }

          // Try to fetch and update the original message
          try {
            const channel = await interaction.client.channels.fetch(
              embedData.channelId
            );
            const message = await safeMessageFetch(
              channel,
              embedData.messageId
            );

            if (message) {
              // Message exists, update it
              await message.edit({ embeds: [updatedEmbed] });
            } else {
              // Message was deleted, create a new one
              console.log(
                `Message ${embedData.messageId} not found, creating new message`
              );
              const newMessage = await channel.send({
                embeds: [updatedEmbed],
                components: [
                  new ActionRowBuilder().addComponents(
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
                  ),
                ],
              });

              // Update the stored data with new message info
              embedData.messageId = newMessage.id;
              embedData.channelId = newMessage.channel.id;
            }
          } catch (channelError) {
            // Channel might not exist or bot has no access
            console.error("Channel access error:", channelError);

            // Create message in current channel as fallback
            const newMessage = await interaction.followUp({
              embeds: [updatedEmbed],
              ephemeral: false,
            });

            // Update stored data
            embedData.messageId = newMessage.id;
            embedData.channelId = newMessage.channel.id;
          }

          // Save the updated embed data
          await embedStorage.saveEmbed(name, {
            ...embedData,
            embed: updatedEmbed.toJSON(),
          });

          await interaction.reply({
            content: `Embed "${name}" updated.`,
            flags: MessageFlags.Ephemeral,
          });
        } catch (error) {
          console.error("Error processing modal submission:", error);

          // Check if interaction was already replied to
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content:
                "An error occurred while updating the embed. Please try again.",
              flags: MessageFlags.Ephemeral,
            });
          } else {
            await interaction.followUp({
              content:
                "An error occurred while updating the embed. Please try again.",
              flags: MessageFlags.Ephemeral,
            });
          }
        }
      }
    }
    // END OF EMBED COMMANDS
    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "select_category"
    ) {
      const categoryName = interaction.values[0].split(":")[1];
      const catalog = await ShopCatalog.findOne({
        guildId: interaction.guild.id,
      });
      const category = catalog.categories.find((c) => c.name === categoryName);

      if (!category || category.items.length === 0) {
        return interaction.update({
          content: "No items found in this category.",
          components: [],
        });
      }

      const options = category.items.map((item) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(item.name)
          .setValue(`item:${categoryName}:${item.name}`)
      );

      const itemMenu = new StringSelectMenuBuilder()
        .setCustomId("select_item")
        .setPlaceholder("Choose an item")
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(itemMenu);

      return interaction.update({
        content: `📦 Items in **${categoryName}**:`,
        components: [row],
      });
    }

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "select_item"
    ) {
      const [_, category, itemName] = interaction.values[0].split(":");

      const modal = new ModalBuilder()
        .setCustomId(`order_modal:${category}:${itemName}`)
        .setTitle("📝 Enter Quantity")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("quantity")
              .setLabel(`How many "${itemName}"?`)
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );

      await interaction.showModal(modal);
    }

    const UserTicket = require("../../data/ticketStorage");

    if (
      interaction.isModalSubmit() &&
      interaction.customId.startsWith("order_modal:")
    ) {
      const [_, category, item] = interaction.customId.split(":");
      const quantity = parseInt(
        interaction.fields.getTextInputValue("quantity")
      );

      if (isNaN(quantity) || quantity <= 0) {
        return interaction.reply({
          content: "Invalid quantity. Please enter a number greater than 0.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`.toLowerCase(),
        type: 0, // GuildText
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: ["ViewChannel"],
          },
          {
            id: interaction.user.id,
            allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
          },
          {
            id: interaction.guild.ownerId,
            allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
          },
        ],
      });

      const QueueConfig = await config.findOne({
        guildId: interaction.guild.id,
      });

      if (!config) {
        await interaction.followUp({
          content:
            "⚠️ Queue channel is not configured. Please ask the owner to set it using `/set-queue-ch`.",
          ephemeral: true,
        });
        return;
      }

      const queueChannel = await interaction.guild.channels
        .fetch(QueueConfig.queueChannelId)
        .catch(() => null);

      if (!queueChannel) {
        await interaction.followUp({
          content:
            "⚠️ Could not find the configured queue channel. It may have been deleted.",
          ephemeral: true,
        });
        return;
      }

      const queueEmbed = new EmbedBuilder()
        .setTitle("🧾 New Order Received")
        .addFields(
          { name: "User", value: `<@${interaction.user.id}>`, inline: true },
          { name: "Item", value: item, inline: true },
          { name: "Quantity", value: quantity.toString(), inline: true },
          { name: "Status", value: "Order Received" },
          { name: "Paid thru", value: "_Staff must set this manually_" },
          { name: "Go to:", value: `<#${ticketChannel.id}>` }
        )
        .setColor("Orange")
        .setFooter({ text: "Use a command or button to update this ticket." });

      const sentMessage = await queueChannel.send({ embeds: [queueEmbed] });

      await UserTicket.create({
        guildId: interaction.guild.id,
        userId: interaction.user.id,
        username: interaction.user.tag,
        category,
        item,
        quantity,
        status: "Order Received",
        payment: "Unpaid",
        channelId: ticketChannel.id,
        ticketMessageId: sentMessage.id,
      });

      return interaction.reply({
        content: `✅ Ticket submitted!\n**Item:** ${item}\n**Category:** ${category}\n**Quantity:** ${quantity}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
