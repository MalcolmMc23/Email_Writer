
import nodemailer from "nodemailer"
import { google } from "googleapis"
import { config } from "dotenv"
config()
import { OpenAI } from "openai";
import readline from "readline";
const openai = new OpenAI();

const userInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

userInterface.prompt() // creates a user input prompt 

userInterface.on('line', async input => { // waits for the response and creates a chat when it returns

    const messages = [{ "role": "user", "content": input }];
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
        tools: [{
            "type": "function",
            "function": {
                "name": "sendMail",
                "description": "sends an email to the a email adress ",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "ToMail": {
                            "type": "string",
                            "description": "The Email your sending to",
                        },
                        "about": {
                            "type": "string",
                            "description": "the content of the email or what the emails about."
                        }
                    },
                    "required": ["ToMail"]
                },
            }
        }],
        tool_choice: "auto",  // auto is default, but we'll be explicit
    });


    let wantsToUseFunction = response.choices[0].finish_reason == "tool_calls"
    if (wantsToUseFunction) {
        if (response.choices[0].message.tool_calls[0].function.name == "sendMail") {
            let argumentObj = JSON.parse(response.choices[0].message.tool_calls[0].function.arguments);
            sendMail(argumentObj.ToMail, argumentObj.about)
            userInterface.close()
        }
    }
}
)







const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REFRESH_TOKEN = process.env.REFRESH_TOKEN
const REDIRECT_URI = 'https://developers.google.com/oauthplayground'

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN })

async function sendMail(ToMail, about) {
    console.log(ToMail, about)
    if (about == "") {
        about = "no context given"
    }
    try {
        const accessToken = await oAuth2Client.getAccessToken()

        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: 'malcolm.e.mcdonald@gmail.com',
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken,
            }
        })

        const mailOptions = {
            from: 'Malcolm McDonald <malcolm.e.mcdonald@gmail.com>',
            to: ToMail,
            subject: "Hello from gmail using api",
            text: about,
        }



        const result = await transport.sendMail(mailOptions)

        console.log(result)
        return result;
    } catch (error) {
        return error
    }
}

    // sendMail().then(result => console.log("Email Sent!!!", result)).catch(error => console.log(error.message))