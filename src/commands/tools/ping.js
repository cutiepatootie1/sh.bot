const { SlashCommandBuilder, MessageFlags } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Just ping stuff"),
  async execute(interaction, client) {
    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });

    const message = await interaction.editReply({
      content: "Pinging...",
    });

    const latency = message.createdTimestamp - interaction.createdTimestamp;
    const apiLatencyRaw = client.ws.ping;
    const apiLatency = apiLatencyRaw >= 0 ? apiLatencyRaw : 0;

    const newMessage = `Client Ping: ${latency}ms\nAPI Latency: ${
      apiLatency >= 0 ? apiLatency + "ms" : "Calculating..."
    }`;

    await interaction.editReply({
      content: newMessage,
    });
  },
};
