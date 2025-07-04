const fs = require("fs");
const { REST, Routes } = require("discord.js");

module.exports = (client) => {
  client.handleCommands = async () => {
    const commandFolders = fs.readdirSync("./src/commands");
    for (const folder of commandFolders) {
      const commandFiles = fs
        .readdirSync(`./src/commands/${folder}`)
        .filter((file) => file.endsWith("js"));

      const { commands, commandArray } = client;
      for (const file of commandFiles) {
        const command = require(`../../commands/${folder}/${file}`);
        commands.set(command.data.name, command);
        commandArray.push(command.data.toJSON());
        console.log(
          `Command: ${command.data.name} has been passed through the handler`
        );
      }
    }

    const clientId = "1389425535255445624";
    const rest = new REST({ version: "10" }).setToken(process.env.token);

    client.guilds.cache.forEach(async (guild) => {
      const guildId = guild.id;

      try {
        console.log("Started refreshing application (/) commands");

        await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
          body: client.commandArray,
        });

        console.log(`Succesfully reloaded application (/) commands for ${guild.name}`);
      } catch (error) {
        console.error(error);
      }
    });
  };
};
