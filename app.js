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

async function runMusicProc(prompt) {

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
                .defaultValue(40)
                .min(0)
                .max(100)
                .step(1)
                .submitOnChange(true)
        });
        page.section('thermometer', section => {
            section
                .deviceSetting('thermometer')
                .capabilities(['temperatureMeasurement', 'relativeHumidityMeasurement'])
                .permissions('rx')
                .multiple(true);
        });
        page.section('hygrometer', section => {
            section
                .deviceSetting('hygrometer')
                .capabilities(['temperatureMeasurement', 'relativeHumidityMeasurement'])
                .permissions('rx')
                .multiple(true);
        });
    })
    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete() // clear any existing configuration
        //await context.api.subscriptions.subscribeToDevices(context.config.contactSensor, 'contactSensor', 'contact', 'myDeviceEventHandler');
        await context.api.subscriptions.subscribeToDevices(context.config.lights, 'switch', 'switch', 'virtualSwitchEventHandler');
        // capabilities, attribute
        await context.api.subscriptions.subscribeToDevices(context.config.thermometer, 'temperatureMeasurement', 'temperature', 'thermometerEventHandler');
        await context.api.subscriptions.subscribeToDevices(context.config.hygrometer, 'relativeHumidityMeasurement', 'humidity', 'hygrometerEventHandler');

        // control volume at updated lifecycle
        console.log('@@@@@@@@ volume:', context.configNumberValue('volume'));
        musicPlayer.controlMusic('volume', context.configNumberValue('volume'));

    })
    .subscribedEventHandler('virtualSwitchEventHandler', async (context, event) => {
        const value = event.value === 'on' ? 'on' : 'off';
        if (event.value === 'on') {
            await runMusicProc();
            // 기기 컨트롤 부분을 따로 만들어서 노래가 끝나는 event 수신하면 기기도 꺼버리기
            //await context.api.devices.sendCommands(context.config.lights, 'switch', 'off');
        }
        if (event.value === 'off') {
            musicPlayer.controlMusic('stop', 0);
        }
    })
    .subscribedEventHandler('thermometerEventHandler', async (context, event) => {
        var temperature = 25;    // default temperature
        humidity = event.value;
        console.log('!@#!@#!@#!@#!@#온도변화 감지', event.value);
    })
    .subscribedEventHandler('hygrometerEventHandler', async (context, event) => {
        var humidity = 60;       // default humidity
        humidity = event.value;
        console.log('!@#!@#!@#!@#!@#습도변화 감지', event.value);
    });

app.get('/', (req, res) => {
    console.log('접속 요청 + 1');
    res.send('asdfasdfasdf');
});

/* Handle POST requests */
app.post('/', function (req, res, next) {
    smartapp.handleHttpCallback(req, res);
});

const server = https.createServer(credentials, app).listen(process.env.PORT, () => {
    console.log(`Server is up and running on port ${process.env.PORT}`)
});
