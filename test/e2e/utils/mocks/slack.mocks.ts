import nock from 'nock';
import config from 'config';

export const mockSlackCalls = (expectedData: Record<string, any> = {}) => nock('https://slack.com:443')
    .post('/api/chat.postMessage', (body) => {
        if (body.channel !== config.get('slack.channel')) {
            return false;
        }

        const data = {
            glad: {
                expected: 0,
                actual: 0
            },
            viirs: {
                expected: 0,
                actual: 0
            },
            monthlySummary: {
                expected: 0,
                actual: 0
            },
            ...expectedData
        }

        const gladTextString = `GLAD alerts - expected ${data.glad.expected} emails (+-5%), got ${data.glad.actual} calls to the Sparkpost API: :heavy_check_mark:`
        const viirsTextString = `VIIRS alerts - expected ${data.viirs.expected} emails (+-5%), got ${data.viirs.actual} calls to the Sparkpost API: :heavy_check_mark:`
        const monthlySummaryTextString = `Monthly summary alerts - expected ${data.monthlySummary.expected} emails (+-5%), got ${data.monthlySummary.actual} calls to the Sparkpost API: :heavy_check_mark:`

        if (!body.text.includes(gladTextString)) {
            throw new Error(`GLAD slack notification mismatch: Expected "${gladTextString}", got "${body.text}`)
        }
        if (!body.text.includes(viirsTextString)) {
            throw new Error(`VIIRS slack notification mismatch: Expected "${viirsTextString}", got "${body.text}`)
        }
        if (!body.text.includes(monthlySummaryTextString)) {
            throw new Error(`Monthly slack notification mismatch: Expected "${monthlySummaryTextString}", got "${body.text}`)
        }
        return true
    })
    .reply(200, {
        "ok": true,
        "channel": config.get('slack.channel'),
        "ts": "1664277721.552469",
        "message": {
            "bot_id": "B01AL7TBNJ2",
            "type": "message",
            "text": "*[Tue Sep 27 2022 13:21:55 GMT+0200 (Central European Summer Time)] [test] Subscription validation process FAILED :x:*\n\nGLAD alerts - expected 0 emails (+-5%), got 0 calls to the Sparkpost API: :heavy_check_mark:\nVIIRS alerts - expected 0 emails (+-5%), got 460 calls to the Sparkpost API: :x:\nMonthly summary alerts - expected 0 emails (+-5%), got 0 calls to the Sparkpost API: :heavy_check_mark:\n",
            "blocks": [{
                "type": "rich_text",
                "block_id": "ud=MQ",
                "elements": [{
                    "type": "rich_text_section",
                    "elements": [{
                        "type": "text",
                        "text": "[Tue Sep 27 2022 13:21:55 GMT+0200 (Central European Summer Time)] [test] Subscription validation process FAILED ",
                        "style": { "bold": true }
                    }, { "type": "emoji", "name": "x", "unicode": "274c", "style": { "bold": true } }, {
                        "type": "text",
                        "text": "\n\nGLAD alerts - expected 0 emails (+-5%), got 0 calls to the Sparkpost API: "
                    }, { "type": "emoji", "name": "heavy_check_mark", "unicode": "2714-fe0f" }, {
                        "type": "text",
                        "text": "\nVIIRS alerts - expected 0 emails (+-5%), got 460 calls to the Sparkpost API: "
                    }, { "type": "emoji", "name": "x", "unicode": "274c" }, {
                        "type": "text",
                        "text": "\nMonthly summary alerts - expected 0 emails (+-5%), got 0 calls to the Sparkpost API: "
                    }, { "type": "emoji", "name": "heavy_check_mark", "unicode": "2714-fe0f" }]
                }]
            }]
        },
        "warning": "missing_charset", "response_metadata": { "warnings": ["missing_charset"] }
    });



