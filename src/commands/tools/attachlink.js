const {
  SlashCommandBuilder,
  MessageFlags,
  AttachmentBuilder,
  EmbedBuilder,
  Message,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("attachlink")
    .setDescription("helps grab a cdn link to your file")
    .addAttachmentOption((option) =>
      option
        .setName("file")
        .setDescription("Upload an image or file")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const attachment = interaction.options.getAttachment("file");

    //valid image file types
    const validImageTypes = [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
    ];
    const isImage = validImageTypes.includes(attachment.contentType);
    if (!isImage) {
      return interaction.editReply({
        content: "Please upload a valid image file (PNG, JPEG, GIF, WEBP",
        flags: MessageFlags.Ephemeral,
      });
    }

    //downloads the file from the ephemeral context
    const response = await fetch(attachment.url);
    const buffer = Buffer.from(await response.arrayBuffer());

    const file = new AttachmentBuilder(buffer, { name: attachment.name });

    const msg = await interaction.editReply({
      content: ["Uploading file..."].join("\n"),
      files: [file],
    });

    const uploadedFile = msg.attachments.first();
    const cdnUrl = uploadedFile.url;

    return interaction.editReply({
      content: [
        `*note: **do not** delete this message or channel - the image link may no longer be valid if you do so.*`,
        "",
        `<${cdnUrl}>`,
        "```",
        cdnUrl,
        "```",
      ].join("\n"),
    });
  },
};
