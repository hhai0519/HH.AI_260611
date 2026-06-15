'use strict';

async function getPayload() {
    const args = process.argv.slice(2).join(' ');
    if (args.trim().length > 0) return args;
    return new Promise((resolve) => {
        let data = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', chunk => { data += chunk; });
        process.stdin.on('end', () => resolve(data));
        setTimeout(() => resolve(data), 1000);
    });
}

function generateFlexMessage(data) {
    const { summary = "無摘要", details = {}, conclusions = [] } = data;

    // Build details components
    const detailBoxContents = [];
    for (const [moduleName, result] of Object.entries(details)) {
        detailBoxContents.push({
            type: "box",
            layout: "vertical",
            margin: "md",
            contents: [
                {
                    type: "text",
                    text: `📌 ${moduleName}`,
                    weight: "bold",
                    size: "sm",
                    color: "#000000"
                },
                {
                    type: "text",
                    text: result.analysis || JSON.stringify(result),
                    size: "xs",
                    color: "#666666",
                    wrap: true,
                    margin: "xs"
                }
            ]
        });
    }

    // Build footer components (Conclusions -> Buttons or Text)
    const footerContents = [];
    if (conclusions.length > 0) {
        footerContents.push({
            type: "text",
            text: "👉 下一步建議：",
            weight: "bold",
            size: "sm",
            color: "#1DB446",
            margin: "sm"
        });

        conclusions.forEach((conclusion, index) => {
            footerContents.push({
                type: "button",
                style: "primary",
                height: "sm",
                color: "#00B900",
                margin: "sm",
                action: {
                    type: "message",
                    label: `建議 ${index + 1}`,
                    text: conclusion.length > 300 ? conclusion.substring(0, 297) + "..." : conclusion
                }
            });
        });
    }

    const flexMessage = {
        type: "flex",
        altText: "投資分析綜合報告",
        contents: {
            type: "bubble",
            size: "giga",
            header: {
                type: "box",
                layout: "vertical",
                backgroundColor: "#2B2B2B",
                contents: [
                    {
                        type: "text",
                        text: "📊 投資分析報告",
                        weight: "bold",
                        size: "xl",
                        color: "#FFFFFF"
                    }
                ]
            },
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "text",
                        text: "【結論先行】",
                        weight: "bold",
                        size: "sm",
                        color: "#1DB446"
                    },
                    {
                        type: "text",
                        text: summary,
                        size: "sm",
                        wrap: true,
                        margin: "md"
                    },
                    {
                        type: "separator",
                        margin: "lg"
                    },
                    ...detailBoxContents
                ]
            },
            footer: {
                type: "box",
                layout: "vertical",
                spacing: "sm",
                contents: footerContents.length > 0 ? footerContents : [
                    {
                        type: "text",
                        text: "無進一步建議",
                        size: "xs",
                        color: "#aaaaaa",
                        align: "center"
                    }
                ]
            }
        }
    };

    return [flexMessage];
}

async function main() {
    try {
        const rawOutput = await getPayload();
        if (!rawOutput || rawOutput.trim() === '') throw new Error("Empty input received.");

        const sanitizedOutput = rawOutput.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        const inputData = JSON.parse(sanitizedOutput);

        const messages = generateFlexMessage(inputData);

        // Output array of messages directly
        console.log(JSON.stringify(messages, null, 2));

    } catch (error) {
        // Fallback to text message
        console.log(JSON.stringify([
            {
                type: 'text',
                text: `[渲染引擎錯誤] 無法產生 Flex Message: ${error.message}`
            }
        ], null, 2));
    }
}

main();
