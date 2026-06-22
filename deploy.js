require("dotenv").config();

const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [

new SlashCommandBuilder()
.setName("whitelist")
.setDescription("Apply for whitelist")
.addStringOption(option=>
option
.setName("name")
.setDescription("Your name")
.setRequired(true)
)

.addUserOption(option=>
option
.setName("vouch")
.setDescription("Who vouches for you")
.setRequired(true)
)

].map(command=>command.toJSON());

const rest = new REST({
version:"10"
}).setToken(process.env.TOKEN);

(async()=>{

try{

console.log("Registering commands...");

await rest.put(
Routes.applicationCommands(
process.env.CLIENT_ID
),
{
body:commands
}
);

console.log("Done");

}catch(error){

console.log(error);

}

})();