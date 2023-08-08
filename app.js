const https = require('https');
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const dotenv = require('dotenv').config();
const morgan = require('morgan');
const fs = require('fs');
const musicPlayer = require('./utils/musicPlayer');
const parseUrlInBracket = require('./utils/parseUrl');
const downloadMusic = require('./utils/downloader');

const { Configuration, OpenAIApi } = require('openai');

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const credentials = {
	key: fs.readFileSync(process.env.PRIVATE_KEY),
	cert: fs.readFileSync(process.env.CERT_KEY),
	ca: fs.readFileSync(process.env.CA_KEY),
};

const configuration = new Configuration({
    organization: process.env.OPENAI_ORGANIZATION,
    apiKey: process.env.OPENAI_SECRET_KEY,
});

const openai = new OpenAIApi(configuration);

const runAPI = async (prompt) => {

    const response = await openai.createCompletion({
        model: process.env.OPENAI_MODEL,
        prompt: prompt,
        max_tokens: 100,
        temperature: 0.6,
    });

	const musicPath = await downloadMusic(parseUrlInBracket(response.data.choices[0].text));  
    musicPlayer.playMusic(musicPath);
}

/* Define the SmartApp */
const smartapp = new SmartApp()
    .enableEventLogging(0) // logs all lifecycle event requests and responses as pretty-printed JSON. Omit in production
    .page('mainPage', (context, page, configData) => {
        page.section('lights', section => {
            section
                .deviceSetting('lights')
                .capabilities(['switch'])
                .permissions('rx')
                .multiple(true);
        });
    
        page.section('controlVolume', section => {
            section.numberSetting('volume')
                .min(0)
                .max(100)
                .step(1)
                .defaultValue(40)
                .style('SLIDER')
                .submitOnChange(true)
        });
    })
    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete() // clear any existing configuration
        //await context.api.subscriptions.subscribeToDevices(context.config.contactSensor, 'contactSensor', 'contact', 'myDeviceEventHandler');
        await context.api.subscriptions.subscribeToDevices(context.config.lights, 'switch', 'switch', 'virtualSwitchEventHandler');
    })
    .subscribedEventHandler('virtualSwitchEventHandler', async (context, event) => {
        const value = event.value === 'on' ? 'on' : 'off';
        if (event.value === 'on') {
            await runAPI();
            console.log('@@@@@@@@ volume:', context.configNumberValue('volume'));
            musicPlayer.controlMusic('volume', context.configNumberValue('volume'));
            //await context.api.devices.sendCommands(context.config.lights, 'switch', 'off');
        }
        if (event.value === 'off') {
            console.log('@@@@@@@@ volume:', context.configNumberValue('volume'));
            musicPlayer.controlMusic('stop', 0);
        }
    });

app.get('/', (req, res) => {
    console.log('접속 요청 + 1');
    res.send('asdfasdfasdf');
    //runAPI("please give me the hot music youtube url");
	//runAPI("please give me the popular music url from youtube in square brackets");
});

/* Handle POST requests */
app.post('/', function (req, res, next) {
    smartapp.handleHttpCallback(req, res);
});

const server = https.createServer(credentials, app).listen(process.env.PORT, () => {
    console.log(`Server is up and running on port ${process.env.PORT}`)
});
