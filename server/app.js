const nodemailer = require("nodemailer");
const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');

const config = require('./emails-infos.json');

const app = express();

const port = 8080;

const transporter = nodemailer.createTransport({
    host: config.provider.server,
    port: 465,
    secure: true,
    auth: {
        user: config.provider.email,
        pass: config.provider.password
    },
    tls: {
        rejectUnauthorized: false
    }
});

app.use(cors())
app.use(bodyParser.json());

app.post('/send', (req, res) => {
    let message = generateMessage(req.body);
    transporter.sendMail(message);
    res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Server up and running on port ${port}.`);
});

function generateMessage(infos) {
    let html =
        `<html>
        <head>
            <style>
                * {
                    padding: 0;
                    margin: 0;
                }
                body {
                    color: #eee;
                    background-color: #222;
                    font-family: Arial, Helvetica, sans-serif;
                }
                a {
                    text-decoration: none;
                    color: #4444EE;
                }
                pre {
                    background-color: #444;
                    display: inline-block;
                    padding: 10px;
                    border-radius: 15px;
                }
            </style>
            <meta charset="utf-8" />
            <title>New contact form : ${infos.subject}</title>
        </head>
        <body>
            <p>New message sent through the 'teomeilleurat.me' contact form<br />
            Message sent by <em>${infos.sender.name}</em> : <a href="${infos.sender.email}">${infos.sender.email}</a></p><br />
            <pre><b>${infos.subject}</b><br /><br />${infos.message}</pre>
            </body>
        </html>`;

    return {
        from: config.provider.email,
        to: config.receiver.email,
        subject: `New contact form : ${infos.subject}`,
        html
    }
}