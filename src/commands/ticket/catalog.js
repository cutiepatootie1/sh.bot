const { SlashCommandBuilder } = require("discord.js");
const ShopCatalog = require("../../data/shopCatalog");
const AllowedRoles = require("../../data/allowedRoles");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("catalog")
    .setDescription("Manage shop catalog")
    .addSubcommand((sub) =>
      sub
        .setName("add-category")
        .setDescription("Add a new category")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Category name").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("add-item")
        .setDescription("Add item to a category")
        .addStringOption((opt) =>
          opt
            .setName("category")
            .setDescription("Category name")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("item").setDescription("Item name").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove-category")
        .setDescription("Remove a category")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Category name").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove-item")
        .setDescription("Remove an item from a category")
        .addStringOption((opt) =>
          opt
            .setName("category")
            .setDescription("Category name")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt.setName("item").setDescription("Item name").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all categories and items")
    )
    .addSubcommand((sub) =>
      sub
        .setName("rename-category")
        .setDescription("Rename a category")
        .addStringOption((opt) =>
          opt
            .setName("old_name")
            .setDescription("Current category name")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("new_name")
            .setDescription("New category name")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("rename-item")
        .setDescription("Rename an item in a category")
        .addStringOption((opt) =>
          opt
            .setName("category")
            .setDescription("Category name")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("old_name")
            .setDescription("Current item name")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("new_name")
            .setDescription("New item name")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const guildOwnerId = interaction.guild.ownerId;
    const memberRoles = interaction.member.roles.cache;

    const allowed = await AllowedRoles.findOne({ guildId });
    const rolePermitted = allowed?.roleIds?.some((roleId) =>
      memberRoles.has(roleId)
    );

    if (userId !== guildOwnerId && !rolePermitted) {
      return interaction.reply({
        content: "You are not authorized to manage the catalog.",
        flags: 64,
      });
    }

    let catalog = await ShopCatalog.findOne({ guildId });
    if (!catalog) {
      catalog = new ShopCatalog({ guildId, categories: [] });
    }

    if (sub === "add-category") {
      const name = interaction.options.getString("name").trim();
      const exists = catalog.categories.find(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      );

      if (exists) {
        return interaction.reply({
          content: `Category **${name}** already exists.`,
          flags: 64,
        });
      }

      catalog.categories.push({ name, items: [] });
      await catalog.save();

      return interaction.reply({
        content: `Category **${name}** added.`,
        flags: 64,
      });
    }

    if (sub === "add-item") {
      const categoryName = interaction.options.getString("category").trim();
      const itemName = interaction.options.getString("item").trim();

      const category = catalog.categories.find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase()
      );

      if (!category) {
        return interaction.reply({
          content: `Category **${categoryName}** not found.`,
          flags: 64,
        });
      }

      const itemExists = category.items.some(
        (i) => i.name.toLowerCase() === itemName.toLowerCase()
      );
      if (itemExists) {
        return interaction.reply({
          content: `Item **${itemName}** already exists in **${categoryName}**.`,
          flags: 64,
        });
      }

      category.items.push({ name: itemName });
      await catalog.save();

      return interaction.reply({
        content: `Item **${itemName}** added to **${categoryName}**.`,
        flags: 64,
      });
    }

    if (sub === "remove-item") {
      const categoryName = interaction.options.getString("category").trim();
      const itemName = interaction.options.getString("item").trim();

      const category = catalog.categories.find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase()
      );

      if (!category) {
        return interaction.reply({
          content: `Category **${categoryName}** not found.`,
          flags: 64,
        });
      }

      const itemIndex = category.items.findIndex(
        (i) => i.name.toLowerCase() === itemName.toLowerCase()
      );

      if (itemIndex === -1) {
        return interaction.reply({
          content: `Item **${itemName}** not found in **${categoryName}**.`,
          flags: 64,
        });
      }

      category.items.splice(itemIndex, 1);
      await catalog.save();

      return interaction.reply({
        content: `Item **${itemName}** removed from **${categoryName}**.`,
        flags: 64,
      });
    }

    if (sub === "remove-item") {
      const categoryName = interaction.options.getString("category").trim();
      const itemName = interaction.options.getString("item").trim();

      const category = catalog.categories.find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase()
      );

      if (!category) {
        return interaction.reply({
          content: `Category **${categoryName}** not found.`,
          flags: 64,
        });
      }

      const itemIndex = category.items.findIndex(
        (i) => i.name.toLowerCase() === itemName.toLowerCase()
      );

      if (itemIndex === -1) {
        return interaction.reply({
          content: `Item **${itemName}** not found in **${categoryName}**.`,
          flags: 64,
        });
      }

      category.items.splice(itemIndex, 1);
      await catalog.save();

      return interaction.reply({
        content: `Item **${itemName}** removed from **${categoryName}**.`,
        flags: 64,
      });
    }

    if (sub === "list") {
      if (!catalog || catalog.categories.length === 0) {
        return interaction.reply({
          content: "The catalog is currently empty.",
          flags: 64,
        });
      }

      const { EmbedBuilder } = require("discord.js");
      const embed = new EmbedBuilder()
        .setTitle("🛍️ Shop Catalog")
        .setColor(0x00ae86);

      for (const category of catalog.categories) {
        const itemList = category.items.length
          ? category.items.map((i) => `• ${i.name}`).join("\n")
          : "*No items*";
        embed.addFields({
          name: category.name,
          value: itemList,
          inline: false,
        });
      }

      return interaction.reply({ embeds: [embed], flags: 64 });
    }

    if (sub === "rename-category") {
      const oldName = interaction.options.getString("old_name").trim();
      const newName = interaction.options.getString("new_name").trim();

      const category = catalog.categories.find(
        (c) => c.name.toLowerCase() === oldName.toLowerCase()
      );
      if (!category) {
        return interaction.reply({
          content: `Category **${oldName}** not found.`,
          flags: 64,
        });
      }

      const exists = catalog.categories.find(
        (c) => c.name.toLowerCase() === newName.toLowerCase()
      );
      if (exists) {
        return interaction.reply({
          content: `A category named **${newName}** already exists.`,
          flags: 64,
        });
      }

      category.name = newName;
      await catalog.save();

      return interaction.reply({
        content: `Category **${oldName}** renamed to **${newName}**.`,
        flags: 64,
      });
    }

    if (sub === "rename-item") {
      const categoryName = interaction.options.getString("category").trim();
      const oldName = interaction.options.getString("old_name").trim();
      const newName = interaction.options.getString("new_name").trim();

      const category = catalog.categories.find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase()
      );
      if (!category) {
        return interaction.reply({
          content: `Category **${categoryName}** not found.`,
          flags: 64,
        });
      }

      const item = category.items.find(
        (i) => i.name.toLowerCase() === oldName.toLowerCase()
      );
      if (!item) {
        return interaction.reply({
          content: `Item **${oldName}** not found in **${categoryName}**.`,
          flags: 64,
        });
      }

      const nameExists = category.items.find(
        (i) => i.name.toLowerCase() === newName.toLowerCase()
      );
      if (nameExists) {
        return interaction.reply({
          content: `An item named **${newName}** already exists in **${categoryName}**.`,
          flags: 64,
        });
      }

      item.name = newName;
      await catalog.save();

      return interaction.reply({
        content: `Item **${oldName}** renamed to **${newName}** in **${categoryName}**.`,
        flags: 64,
      });
    }
  },
};
