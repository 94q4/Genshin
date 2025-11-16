import axios from "axios";

export interface GenshinClientOptions {
    uid: string;
    server: string;
    ltoken: string;
    ltuid: string;
}

export class GenshinClient {
    private uid: string;
    private server: string;
    private ltoken: string;
    private ltuid: string;

    constructor(options: GenshinClientOptions) {
        this.uid = options.uid;
        this.server = options.server;
        this.ltoken = options.ltoken;
        this.ltuid = options.ltuid;
    }

    private get headers() {
        return {
            Cookie: `ltoken_v2=${this.ltoken}; ltuid_v2=${this.ltuid}`,
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://act.hoyolab.com/"
        };
    }

    async getDailyNote() {
        const url = "https://bbs-api-os.hoyoverse.com/game_record/genshin/api/dailyNote";
        const res = await axios.get(url, {
            params: {
                role_id: this.uid,
                server: this.server,
                schedule_type: 1
            },
            headers: this.headers
        });
        return res.data;
    }
    async getAll() {
        const [daily] = await Promise.all([
            this.getDailyNote()
        ]);

        return {
            dailyNote: daily
        };
    }
}
