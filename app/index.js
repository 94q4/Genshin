import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from "discord.js";
import { GenshinClient } from "./genshinClient.js";
import cron from "node-cron";
import { serve } from "@hono/node-server";
import healthCheckServer from "./healthcheck.js";

const BOT_TOKEN = "MTQzODA3MjQyMzc5ODAxODE4OA.GKorlK.nHQ31gXlWn3hCf696CaXWZmZGPM9DMg2zyE0xU";
const CLIENT_ID = "1438072423798018188";
const GUILD_ID = "1438060736034115586";
const CHANNEL_ID = "1439492315730149416";


const RESIN_THRESHOLD = 200; // Cron通知の閾値
const MAX_RESIN_ALERT = true; // 天然樹脂満タン時に通知するか

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const genshin = new GenshinClient({
    uid: "894577157",
    server: "os_asia",
    ltoken: "v2_CAISDGM5b3FhcTNzM2d1OBokMGQxMmE4YTItMjQxZi00NTQwLTk1NjMtZThiMzM1NWNjZjBkIIri1cgGKL_fvJ0HMK2o0bIBQgtiYnNfb3ZlcnNlYVhq.CnEVaQAAAAAB.MEYCIQC3T9HYqcVi0Jr0OzC6gphV3CH-96808ob24LJCHvPH4wIhAKpPKWmKh04E2N55vrqXkixWImZG2oWIvh5T-dvmkl1I",
    ltuid: "374625325"
});

serve({
    fetch: healthCheckServer.fetch,
    port: 8000,
});

// --- スラッシュコマンド登録 ---
const commands = [
    new SlashCommandBuilder()
        .setName("resin")
        .setDescription("テイワットの樹脂を確認するわ。")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);

(async () => {
    try {
        console.log("スラッシュコマンドを登録中...");
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        console.log("スラッシュコマンド登録完了");
    } catch (error) {
        console.error(error);
    }
})();

// --- Resinメッセージ生成関数 ---
function createResinMessage(data) {
    const currentResin = data.current_resin;
    const maxResin = data.max_resin;
    const resinRecoveryTime = data.resin_recovery_time;
    const finishedTaskNum = data.finished_task_num;
    const totalTaskNum = data.total_task_num;
    const current_home_coin = data.current_home_coin;
    const max_home_coin = data.max_home_coin;
    const home_coin_recovery_time = data.home_coin_recovery_time;

    let statusMessage = "";

    if (currentResin === maxResin) {
        statusMessage = "樹脂が満タンじゃない。とっとと消費しなさい。";
    } else if (currentResin >= 160) {
        statusMessage = "樹脂がもうすぐ満タンになるわ。急いで消費しなさい。";
    } else if (currentResin >= 120) {
        statusMessage = "樹脂がたまっているわ。そろそろ消費しなさい。";
    } else if (currentResin >= 100) {
        statusMessage = "樹脂が半分たまっているわ。忘れないうちに消費しなさい。";
    } else if (currentResin >= 80) {
        statusMessage = "樹脂がたまっているわ。後で消費するのを忘れないようにしなさい。";
    } else if (currentResin >= 40) {
        statusMessage = "樹脂はまだ全然たまってないわ。もう少し待ちなさい。";
    } else {
        statusMessage = "樹脂はほぼすっからかんね。時間を空けて確認なさい。";
    }

    const hours = Math.floor(resinRecoveryTime / 3600);
    const minutes = Math.floor(resinRecoveryTime / 60);
    const seconds = resinRecoveryTime % 60;

    return `テイワットを観察してきたわ。
今の天然樹脂は ${currentResin}、${statusMessage}
回復までの時間は、 ${hours}時間${minutes}分と${seconds}秒ね。
今日のデイリー任務は、${finishedTaskNum}個完了しているわ。（${finishedTaskNum} / ${totalTaskNum}） 
現在の洞天宝銭は ${current_home_coin}、回復までの時間は ${Math.floor(home_coin_recovery_time / 60)}分ね。（${current_home_coin} / ${max_home_coin}）`;
}

// --- Bot起動時 ---
client.once("ready", async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    const channel = await client.channels.fetch(CHANNEL_ID);

    if (!channel) {
        console.error("通知チャンネルが見つかりません");
        return;
    }

    // Cron: 毎日30分毎に天然樹脂のチェック
    cron.schedule("0,8,30 * * * *", async () => {
        try {
            const hour = new Date().getHours();
            const minute = new Date().getMinutes();
            const second = new Date().getSeconds();
            const result = await genshin.getAll();
            const data = result.dailyNote.data;
            const finishedTaskNum = data.finished_task_num;
            const totalTaskNum = data.total_task_num;
            const current_home_coin = data.current_home_coin;
            const max_home_coin = data.max_home_coin;
            const home_coin_recovery_time = data.home_coin_recovery_time;
            if (!data) return;
            const currentResin = data.current_resin;
            
            // 樹脂満タン通知
            if (MAX_RESIN_ALERT && currentResin === data.max_resin) {
                await channel.send(`樹脂が満タンよ。早く消費しなさい。`);
                console.log("Resin満タン通知送信");
                await wait(1);
                return;
            } else if(MAX_RESIN_ALERT && currentResin === 199 && resinRecoveryTime < 30) {
                await channel.send(`樹脂が満タンになったわ。早く消費しなさい。`);
                console.log("Resin満タン通知送信");
                await wait(1);
                return;
            } else if(currentResin <= data.max_resin){
                await channel.send(`今の樹脂は${currentResin}。報告、感謝しなさい。`);
                console.log("Resin満タン通知送信");
                await wait(1);
                return;
            }
            
            if (current_home_coin === max_home_coin) {
                await channel.send(`洞天宝銭が満タンね。`);
                console.log("おくったよ");
                await wait(1);
                return;
            }         
            
            if(hour >= 10 && hour < 21) { 
                if (finishedTaskNum < totalTaskNum ) {
                    await channel.send(`まだデイリー任務が終わってないじゃない。早く終わらせなさい。`);
                    console.log("おくったよ");
                    await wait(1);
                    return;
                }
            }
        } catch (err) {
            console.error("Cron エラー:", err);
        }
    });
});

// --- スラッシュコマンド実行 ---
client.on("interactionCreate", async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === "resin") {
        try {
            const result = await genshin.getAll();
            const data = result.dailyNote.data;

            if (!data) {
                await interaction.reply("Daily note data が取得できませんでした");
                return;
            }

            const message = createResinMessage(data);
            await interaction.reply(message);

        } catch (err) {
            console.error("Slash コマンドエラー:", err);
            await interaction.reply("データ取得中にエラーが発生しました");
        }
    }
});

client.login(BOT_TOKEN);
