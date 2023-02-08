import * as dotenv from 'dotenv';
dotenv.config()
import { Bot, webhookCallback } from "grammy";
import express from "express";

import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const tgKey = process.env.TELEGRAM_KEY || "";
const mentionedCmd = '/maria';
// Create a bot using the Telegram token
const bot = new Bot(tgKey);

// Handle the /hey command to greet the user
bot.command("hey", (ctx) => {
  ctx.reply(`Hey ${ctx.update.message?.from.first_name}. How is it going?`);
});

// Suggest commands in the menu
bot.api.setMyCommands([
  { command: "hey", description: "Be greeted by the bot" },
  {
    command: "maria",
    description: "Ask me anything start by typing /maria [your text]",
  },
]);

// Handle all other messages and the /start command
const introductionMessage = `Hello! My name is Maria. I am powered by my boy friend 🚀Chips Ahoy🚀.
I am really excited to be here talking with you. Feel free to ask me anything.`;
const refusedMsg = 'Mời quý anh chị chim kút!';

const replyToCommand = async (ctx: any) => {
  const msg = ctx.update.message;
  console.log('calling replyToCommand--------------', JSON.stringify(msg.text));
  if (!msg.from) {
    ctx.reply(refusedMsg, {
      parse_mode: "HTML",
    });
  } else if (!msg.text) {
    const invalidMsg = "Quý anh vui lòng khép loa thay vì thổi ra những điều nhảm nhí!";
    ctx.reply(invalidMsg, {
      parse_mode: "HTML",
    });
  } else if (msg.text.toLowerCase().startsWith(mentionedCmd.toLowerCase())){
    const extractedText = msg.text.substring(mentionedCmd.length, msg.text.length);
    console.log('Extracted Text: ' + extractedText);
    const opaiRes = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `${extractedText}`,
      temperature: 0,
      max_tokens: 3000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    ctx.reply(opaiRes.data.choices[0].text, {
      parse_mode: "HTML",
    });
  }
  return null;
};

bot.command("start", replyToCommand);
bot.on("message", replyToCommand);

// Start the server
if (process.env.NODE_ENV === "production") {
  // Use Webhooks for the production server
  const app = express();
  app.use(express.json());
  app.use(webhookCallback(bot, "express"));

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Bot listening on port ${PORT}`);
  });
} else {
  // Use Long Polling for development
  bot.start();
}
