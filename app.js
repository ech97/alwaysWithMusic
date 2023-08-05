const https = require('https');
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const dotenv = require('dotenv').config();
const morgan = require('morgan');
const fs = require('fs');
const { Configuration, OpenAIApi } = require('openai');

const app = express();

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
const runAPI = async (prompt) => {
    const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 100,
        temperature: 0.6,
      });
    res.send('- completion:\n' + response.data.choices[0].text);
    res.send('\n- total tokens: ' + response.data.usage.total_tokens);
    res.send('*- completion ended...');
    // getModelLists();
}

// runAPI("please give me the hot music youtube url");


// const options = {
//     key: fs.readFileSync('./keys/private.pem', "utf-8"),
//     cert: fs.readFileSync('./keys/cert.pem', "utf-8")
// };

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
/* Define the SmartApp */
const smartapp = new SmartApp()
    .enableEventLogging(2) // logs all lifecycle event requests and responses as pretty-printed JSON. Omit in production
    .appId('5907d734-cfd4-44c5-9f73-193a0f96d654')
    .page('mainPage', (context, page, configData) => {
        page.section('sensors', section => {
            section
                .deviceSetting('contactSensor')
                .capabilities(['contactSensor'])
        });
        page.section('lights', section => {
            section
                .deviceSetting('lights')
                .capabilities(['switch'])
                .permissions('rx')
                .multiple(true);
        });
    })
    // Called for both INSTALLED and UPDATED lifecycle events if there is no separate installed() handler
    .updated(async (context, updateData) => {
        await context.api.subscriptions.delete() // clear any existing configuration
        await context.api.subscriptions.subscribeToDevices(context.config.contactSensor, 'contactSensor', 'contact', 'myDeviceEventHandler');
    })
    .subscribedEventHandler('myDeviceEventHandler', async (context, event) => {
        const value = event.value === 'open' ? 'on' : 'off';
        await context.api.devices.sendCommands(context.config.lights, 'switch', value);
    });

app.get('/', (req, res) => {
    console.log('접속 요청 + 1');
    runAPI("please give me the hot music youtube url");
    res.end('ㅎㅇㅎㅇ');
});

app.get('/oauth', (req, res) => {
	console.log(JSON.stringify(req.query))
	res.send("OK")
});

/* Handle POST requests */
app.post('/', function (req, res, next) {
    smartapp.handleHttpCallback(req, res);
});


//const server = https.createServer(options, app);
app.listen(process.env.PORT, () => console.log(`Server is up and running on port ${process.env.PORT}`));