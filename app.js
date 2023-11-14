const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { config } = require("dotenv");
config()


const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REFRESH_TOKEN = process.env.REFRESH_TOKEN
const REDIRECT_URI = 'https://developers.google.com/oauthplayground'

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN })

async function sendMail() {
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
            to: '810828@seq.org',
            subject: "Hello from gmail using api",
            text: "",
        }

        console.log("%%%%%%%%%%%%%%%%%%%%", mailOptions)


        const result = await transport.sendMail(mailOptions)


        return result;
    } catch (error) {
        return error
    }
}


sendMail().then(result => console.log("Email Sent!!!", result)).catch(error => console.log(error.message))