
import nodemailer from "nodemailer"
import { google } from "googleapis"
import { config } from "dotenv"
config()
import { OpenAI } from "openai";
import readline from "readline";
const openai = new OpenAI();

// Create a readline interface for user input and output
const userInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

userInterface.prompt() // creates a user input prompt 
userInterface.on('line', async input => { // waits for the user to input 
    const messages = [{ "role": "user", "content": input }];
    // Call OpenAI's chat completions API with the user's input
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-1106",
        messages: messages,
        // Define the tools array with a function tool
        tools: [{
            "type": "function",
            "function": {
                "name": "sendMail", // Name of the function
                "description": "sends an email to the a email adress ", // Description of the function
                "parameters": { // Parameters of the function
                    "type": "object",
                    "properties": {
                        "ToMail": { // Parameter 1: ToMail
                            "type": "string",
                            "description": "The Email your sending to",
                        },
                        "about": { // Parameter 2: about
                            "type": "string",
                            "description": "the content of the email."
                        }
                    },
                    "required": ["ToMail", "about"] // Required parameters
                },
            }
        }],
        tool_choice: "auto",  // Specify the tool choice strategy
    });

    //checks if chatgpt wants to use a function
    let wantsToUseFunction = response.choices[0].finish_reason == "tool_calls"
    if (wantsToUseFunction) {
        // Check if the function to be called is "sendMail"
        if (response.choices[0].message.tool_calls[0].function.name == "sendMail") {

            // Parse the arguments for the function from the response
            let argumentObj = JSON.parse(response.choices[0].message.tool_calls[0].function.arguments);
            // Call the sendMail function with the parsed arguments
            // Call the sendMail function with the parsed arguments


            const loader = loadingAnimation();


            await sendMail(argumentObj.ToMail, argumentObj.about)
                // If the email is sent successfully, log the result
                .then(result => console.log("Email Sent!!!", result))
                // If there is an error in sending the email, log the error message
                .catch(error => console.log(error.message))


            clearInterval(loader);
            process.stdout.write("\rDone!   \n");

            // Close the user inputstream/ui after sending the mail
            userInterface.close()
        }
    }
}
)

function loadingAnimation() {
    const P = ["\\", "|", "/", "-"];
    let x = 0;
    return setInterval(() => {
        process.stdout.write(`\rLoading ${P[x++]}`);
        x &= 3;
    }, 250);
}

// Define constants for OAuth2 client
const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REFRESH_TOKEN = process.env.REFRESH_TOKEN
const REDIRECT_URI = 'https://developers.google.com/oauthplayground'

// Create a new OAuth2 client with the defined constants
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
// Set the credentials for the OAuth2 client
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN })

// Define an asynchronous function to send an email
async function sendMail(ToMail, about) {
    // Log the email address and content to the console
    console.log(ToMail, about)
    if (about.length < 200) {
        about = await writeAbout(about);
    }

    try {
        // Get an access token from the OAuth2 client
        const accessToken = await oAuth2Client.getAccessToken()
        // Create a new transport object using Nodemailer and Gmail
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
        // Define the mail options
        const mailOptions = {
            from: 'Malcolm McDonald <malcolm.e.mcdonald@gmail.com>',
            to: ToMail,
            subject: "Hello from gmail using api",
            text: about,
        }

        // Send the email and store the result
        const result = await transport.sendMail(mailOptions)

        // Log the result to the console
        // console.log(result, "Email sent!")
        return result;
    } catch (error) {
        return error
    }
}
async function writeAbout(about) {
    const messages = [{ "role": "user", "content": "pleas write an email about: " + about }];
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
    });
    return response.choices[0].message.content
}

