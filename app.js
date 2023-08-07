const https = require('https');
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const dotenv = require('dotenv').config();
const morgan = require('morgan');
const fs = require('fs');
const playMusic = require('./play');
const parseUrlInBracket = require('./parseUrl');
const youtubedl = require('youtube-dl-exec');

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

const getModelLists = async () => {
    const response = await openai.listModels();
    const models = response.data.data;
    for (let modelIdx = 0; modelIdx.length; ++modelIdx) {
        console.log(modelIdx + ':' + models[i].id);
    }
}

var mpvPlayer;
const runAPI = async (prompt) => {

    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 100,
        temperature: 0.6,
    });

	const urlInBracket = parseUrlInBracket(response.data.choices[0].text);
    console.log('original text:', response.data.choices[0].text);
    console.log('parsing url:', urlInBracket);

    let playFilePath = process.env.DEFAULT_PLAY_FILE_PATH;
	try {
        // download over 10s throw error
	    const output = await youtubedl(urlInBracket, {
		    format: 'ba',
			'force-overwrites': true,
		    //quiet: false,
		    output: process.env.PLAY_FILE_PATH,
	    });
		playFilePath = process.env.PLAY_FILE_PATH;
		console.log('download ended', output);
	} catch (err) {
		playFilePath = process.env.DEFAULT_PLAY_FILE_PATH;
        console.log('not available youtube link');
	}

    mpvPlayer = playMusic(playFilePath);
}

function controlMusic(mode, volume) {
    if (mode === 'stop') {
        try {
            mpvPlayer.stop();
        } catch (err) {
            console.error(err);
        }
    }
    else if (mode === 'volume') {
        try {
            mpvPlayer.volume(volume);
        } catch (err) {
            console.error(err);
        }
    }
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
            controlMusic('volume', context.configNumberValue('volume'));
            //await context.api.devices.sendCommands(context.config.lights, 'switch', 'off');
        }
        if (event.value === 'off') {
            console.log('@@@@@@@@ volume:', context.configNumberValue('volume'));
            controlMusic('stop', 0);
        }
    });

app.get('/', (req, res) => {
    console.log('접속 요청 + 1');
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
