const https = require('https');
const express = require('express');
const SmartApp = require('@smartthings/smartapp');
const dotenv = require('dotenv').config();
const morgan = require('morgan');
const fs = require('fs');
const musicPlayer = require('./utils/musicPlayer');
const getYoutubeUrl = require('./utils/titleToYoutubeUrl');
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
        max_tokens: 200,
        temperature: 0.3,
    });

    const musicUrl = await getYoutubeUrl(response.data.choices[0].text);  
	const musicPath = await downloadMusic(musicUrl);

    musicPlayer.playMusic(musicPath);
}

async function switchOffAfterPlay(context) {
    if (musicPlayer.getIsPlayMusic() == false) {
        // 기기 컨트롤 부분을 따로 만들어서 노래가 끝나는 event 수신하면 기기도 꺼버리기
        await context.api.devices.sendCommands(context.config.lights, 'switch', 'off');
    }
}

// default temperature and humidity
var temperature = 25.0;
var humidity = 60;
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
        musicPlayer.controlMusic('volume', context.configNumberValue('volume'));

    })
    .subscribedEventHandler('virtualSwitchEventHandler', async (context, event) => {
        const value = event.value === 'on' ? 'on' : 'off';
        if (event.value === 'on') {
            await runMusicProc(`give me a music title fits at ${temperature} degrees celcius and ${humidity} percent humidity in square brackets`);
            musicPlayer.controlMusic('volume', context.configNumberValue('volume'));

            // setTimeout으로 감싸기
            await switchOffAfterPlay(context);
        }
        if (event.value === 'off') {
            musicPlayer.controlMusic('stop', 0);
        }
    })
    .subscribedEventHandler('thermometerEventHandler', async (context, event) => {
        humidity = event.value;
        console.log('receive thermometer event: [temperature]', event.value);
    })
    .subscribedEventHandler('hygrometerEventHandler', async (context, event) => {
        humidity = event.value;
        console.log('receive hygrometer event: [humidity]', event.value);
    });

const cookieParser = require('cookie-parser');
const path = require('path');
const session = require('express-session');
const nunjucks = require('nunjucks');
const passport = require('passport');

const pageRouter = require('./routes/page');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const { sequelize } = require('./models');
const passportConfig = require('./passport');

passportConfig();

app.set('view engine', 'html');
nunjucks.configure('views', {
    express: app,
    watch: true,
});

sequelize.sync({ force: false })
    .then(() => {
        console.log('데이터베이스 연결 성공');
    })
    .catch((err) => {
        console.error(err);
    });

app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secrue: false,
    },
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', pageRouter);
app.use('/auth', authRouter);
app.use('/user', userRouter);

app.use((req, res, next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status= 404;
    next(error);
});

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

app.get('/', (req, res) => {
    console.log('connection + 1');
    res.send('alwaysWithMusic');
});

/* Handle POST requests */
app.post('/', function (req, res, next) {
    smartapp.handleHttpCallback(req, res);
});

const server = https.createServer(credentials, app).listen(process.env.PORT, () => {
    console.log(`Server is up and running on port ${process.env.PORT}`)
});
