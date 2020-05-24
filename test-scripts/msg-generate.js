// EML Message Generator - cleidigh

var argv = require('minimist')(process.argv.slice(2));
const { v4: uuidv4 } = require("uuid");
const fs = require('fs-extra');

var msgFrom1 = "From - Sat Nov  1 12:39:54 2008\n";
var msgXMStatus = "X-Mozilla-Status: 0000\n";
var msgXMStatus2 = "X-Mozilla-Status2: 00000000\n";

var msgTo = "To: test@example.com\n";
var msgFrom = "From: test@example.com\n";
var msgDate = "Date: Sat, 30 Dec 2017 19:12:38 +0100\n";
var msgHdrEnd = "User-Agent: Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:59.0) Gecko/20100101\n";
msgHdrEnd += "Thunderbird/59.0a1\n";
msgHdrEnd += "MIME-Version: 1.0\n";
msgHdrEnd += "Content-Type: text/plain; charset=windows-1252; format=flowed\n";
msgHdrEnd += "Content-Transfer-Encoding: base64\n";
msgHdrEnd += "Content-Language: en-US\n\n";
// msg1 += "U2VhcmNoIGZvciBodWh1\n";

var msg100ch = "0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789";
var msg1000ch = msg100ch + msg100ch + msg100ch + msg100ch + msg100ch + msg100ch + msg100ch + msg100ch + msg100ch + msg100ch;
var msg500ch = msg100ch + msg100ch + msg100ch + msg100ch + msg100ch;

const generateRandomString = function (length = 6) {
	return Math.random().toString(20).substr(2, length);
}

function generateMessage(length) {
	// console.debug('GenerateMessage ');
	let subject = "Msg " + generateRandomString(10);
	let muuid = uuidv4();
	var msgSubject = `Subject: ${subject}\n`;
	var msgID = `Message-ID: <${muuid}@example.com>\n`;

	let msgData = "";
	msgData +=
		msgFrom1 +
		msgXMStatus +
		msgXMStatus2 +
		msgTo +
		msgFrom +
		msgSubject +
		msgID +
		msgDate +
		msgHdrEnd;

	msgData += generateRandomString(100);
	msgData += msg500ch;

	for (let i = 0; i < length - 1; i++) {
		msgData += msg1000ch;
		// console.debug('Add ' + msgData.length);
	}

	// console.debug(msgData);
	let msgObj = {};
	msgObj.subject = subject;
	msgObj.data = msgData;
	return msgObj;
}

function getRandomArbitrary(min, max) {
	return Math.trunc(Math.random() * (max - min) + min);
}

function populateOSFolder(folderPath, nMessages, lowSize, highSize) {

	for (let i = 0; i < nMessages; i++) {
		let sizeK = getRandomArbitrary(lowSize, highSize);
		let msgObj = generateMessage(sizeK);
		fs.outputFileSync(folderPath + '\\' + msgObj.subject + '_' + sizeK + 'k.eml', msgObj.data);
	}
}
// generateMessage(2);
let startTime = new Date();
// populateOSFolder('.\\Top3\\mTest20000', 20000, 20, 1000);
if (argv.h) {
	console.debug('msg-generate: EML Message Generator - cleidigh');
	console.debug('\nUsage:\n');
	console.debug('node msg-generate [-p outpath, -c msgcount, --mink minsizek, --maxk maxsizek, -h]');
	console.debug('\t-p : output path (default: .\\msgsGenTest)');
	console.debug('\t-c : message count (default: 1)');
	console.debug('\t--mink : minimum message size(k) (default: 10)');
	console.debug('\t--maxk : maximum message size(k) (default: 100)');
	console.debug('\t-h : usage/help');
} else {
	populateOSFolder(argv.p || ".\\msgsGenTest", argv.c || 1, argv.mink || 10, argv.maxk || 30);

	let stepTime = new Date();
	console.debug('MessageGeneration ElapsedTime: ' + (stepTime - startTime) / 1000 + ' sec');
}
