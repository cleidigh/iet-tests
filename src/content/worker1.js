// const { OS } =  importScripts("resource://gre/modules/osfile.jsm");
// const { OS } = require("resource://gre/modules/osfile.jsm");
importScripts("resource://gre/modules/osfile.jsm");

var msgCount = 0;
var folderArray = [];
var endTime, startTime;

function worker1(dirPath) {
	console.debug('started worker  ' + dirPath);
}

onmessage = function (event) {
	console.debug(event);
	switch (event.data.msgType) {
		case 'startImport':
			msgCount = 0;

			let dirPath = event.data.d;
			console.debug('started worker import:  walkD ' + dirPath);
			startTime = new Date();
			console.debug('StartTime: ' + startTime.toISOString());

			folderArray = dw(dirPath);
			folderArray.unshift(dirPath);
			// let d = importOSDirIterationCW(dirPath, event.data.bc);
			console.debug('centerfolds or array message');
			postMessage({ msgType: 'folderArray', folderArray: folderArray});
			
			endTime = new Date();
			console.debug('ElapsedTime: ' + (endTime - startTime) / 1000 + '  : ' + folderArray.length);
			break;
		case 'createFoldersComplete':
			console.debug('ReceivedFoldersComplete');
			console.debug(folderArray);
			for (let index = 0; index < folderArray.length; index++) {
				workerMessageFolderImport(folderArray[0], folderArray[index], index);
				
			}

			endTime = new Date();
			console.debug('S ElapsedTime: ' + (endTime - startTime) / 1000 + '  : ' + msgCount);
		
			postMessage({ msgType: 'messagesComplete'});
			break;

		default:
			break;
	}
	// postMessage('MfolderArray');
}


// this works - ~0.25s for 10000 folders

function dw(d) {
	var subdirs = [];
	var iterator = new OS.File.DirectoryIterator(d);


	// console.debug('Walk  '+d);
	try {

		// for (let entry in iterator) {
		iterator.forEach(entry => {
			// console.debug(entry);
			if (entry.isDir) {
				subdirs.push(entry.path);
				// console.debug('Dir: ' + entry.name + '  DS: ' + i.size);
				// entry is a directory
				let dirs = dw(entry.path);
				subdirs = subdirs.concat(dirs);
			} else {
				// subdirs.push(entry.path);
			}
		});
		// return [entry for (entry in iterator) if (entry.isDir) ];

	} finally {
		iterator.close();
	}
	return subdirs;

}

function dw2(d) {
	var subdirs = [];
	var iterator = new OS.File.DirectoryIterator(d);


	// console.debug('Walk  '+d);
	try {

		// for (let entry in iterator) {
		iterator.forEach(entry => {
			// console.debug(entry);
			let i = OS.File.stat(entry.path);
			if (entry.isDir) {
				subdirs.push(entry.path);
				// console.debug('Dir: ' + entry.name + '  DS: ' + i.size);
				// entry is a directory
				let dirs = dw(entry.path);
				subdirs = subdirs.concat(dirs);
			} else {
				subdirs.push(entry.path);
				console.debug('FileS: ' + i.size);
			}
		});
		// return [entry for (entry in iterator) if (entry.isDir) ];

	} finally {
		iterator.close();
	}
	return subdirs;

}

function importOSDirIterationCW(rootDirPath, test_bcount) {
	var iterator = new OS.File.DirectoryIterator(rootDirPath);
	var subdirs = [];
	var p = [];
	var exit = false;
	// var test_bcount = Preferences.get("extensions.iet-ng-tests.test_mcount").value;
	// var test_bcount = 80;

	// while (true) {
	for (let index = 0; index < 1000; index++) {
		// console.debug('Index ' + index);
		p = iterator.nextBatch(test_bcount);

		// let ea = Promise.all();
		// console.debug('dirs: ' + ea.map(d => d.path + ' '));
		// console.debug(p);
		if (!p.length) {
			// console.debug('and batch');
			break;
		}
		subdirs = subdirs.concat(p);
		// }

		// p.then(e => {
		// 	console.debug(e);
		// 	console.debug(e.length);
		// 	if (!e.length) {
		// 		exit = true;
		// 	}
		// });
	}
	// console.debug('Finish');
	return subdirs;

	// await Promise.all(p);
}

function workerMessageFolderImport(rootFolder, dirPath, folderIndex) {
	var iterator = new OS.File.DirectoryIterator(dirPath);
	var messageEntries = [];
	var fileArray = "";


	console.debug('Folder ' + dirPath);
	// Iterate through the directory
	let p = iterator.forEach(
		function onEntry(entry) {

			try {
				if (!entry.isDir) {
					// console.debug(entry.name);
					// console.debug(msgCount + '  : ' + entry.path);
					if (entry.name.endsWith(".eml")) {
						fileArray = readFile1(entry.path);
						fileArray = fixFile(fileArray, 1, entry.name);
						try {

							// console.debug('Adding ' + msgCount);
							// msgFolder.addMessage(fileArray);
							// var message = {msgType: 'fileArray', fileArray: fileArray};
							// var fileArray2 = new ArrayBuffer(50);
							postMessage({ msgType: 'fileArray', fileArray: fileArray, folderIndex: folderIndex});
							msgCount++;
							// postMessage({msgType: 'fileArray', fileArray: fileArray}, fileArray.buffer);
							// postMessage(fileArray, fileArray.buffer);
							// postMessage({msgType: 'fileArray', fileArray2: fileArray2}, [fileArray2]);

							// postMessage({msgType: 'fileArray', fileArray: "hello there this is text"});
							// console.debug('Added ' + entry.path);
							// if (msgCount % 10 === 0) {
							// 	IETwritestatus('Messages Imported: ' + msgCount);
							delete fileArray;
							// }
						} catch (e) {
							console.debug('  AdMessageError ' + e);
							console.debug(entry.path);
						}
						// messageEntries.push(entry);

					} else {
						console.debug('Skip Non-EML File: ' + entry.path + ' - ' + entry.name);
					}
					// console.debug(fileArray);
				} else {
					// console.debug('folder entry  ' + entry.name);
				}
			} catch (e) {
				console.debug('EntryException ' + e);
				throw (e);
			}
		}
	);



}

function readFile1(filePath) {

	let decoder = new TextDecoder();        // This decoder can be reused for several reads
	let array = OS.File.read(filePath); // Read the complete file as an array

	// console.debug('file okay ');
	// console.debug('Size ' + array.length);
	// var ab = new ArrayBuffer(array.length);
	// ab = decoder.decode(array);        // Convert this array to a text
	return decoder.decode(array);        // Convert this array to a text
}

function fixFile(data, msgFolder, file) {
	// Fix and transform data

	// var msgFolder = GetSelectedMsgFolders()[0];
	// msgFolder = msgFolder.QueryInterface(Ci.nsIMsgLocalMailFolder);

	// strip off the null characters, that break totally import and display
	// data = data.replace(/\x00/g, "");
	var now = new Date;
	var nowString;

	try {
		nowString = now.toString().match(/.+:\d\d/);
		nowString = nowString.toString().replace(/\d{4} /, "");
		nowString = nowString + " " + now.getFullYear();
	} catch (e) {
		nowString = now.toString().replace(/GMT.+/, "");
	}

	var top = data.substring(0, 2000);

	// Fix for crazy format returned by Hotmail view-source
	if (top.match(/X-Message-Delivery:.+\r?\n\r?\n/) || top.match(/X-Message-Info:.+\r?\n\r?\n/))
		data = data.replace(/(\r?\n\r?\n)/g, "\n");

	// Fix for some not-compliant date headers
	if (top.match(/Posted-Date\:/))
		data = data.replace("Posted-Date:", "Date:");
	if (top.match(/X-OriginalArrivalTime:.+\r?\n\r?\n/))
		data = data.replace("X-OriginalArrivalTime:", "Date:");

	// Some eml files begin with "From <something>"
	// This causes that Thunderbird will not handle properly the message
	// so in this case the first line is deleted
	data = data.replace(/^From\s+.+\r?\n/, "");

	// Prologue needed to add the message to the folder
	var prologue = "From - " + nowString + "\n"; // The first line must begin with "From -", the following is not important
	// If the message has no X-Mozilla-Status, we add them to it
	// cleidigh - correct logic conversion
	if (!data.includes("X-Mozilla-Status"))
		prologue = prologue + "X-Mozilla-Status: 0000\nX-Mozilla-Status2: 00000000\n";
	else {
		// else if (IETprefs.getBoolPref("extensions.importexporttoolsng.reset_mozilla_status")) {
		// Reset the X-Mozilla status
		data = data.replace(/X-Mozilla-Status: \d{4}/, "X-Mozilla-Status: 0000");
		data = data.replace(/X-Mozilla-Status2: \d{8}/, "X-Mozilla-Status2: 00000000");
	}
	// If the message has no X-Account-Key, we add it to it, taking it from the account selected
	// cleidigh - correct logic conversion

	// if (!data.includes("X-Account-Key")) {
	// 	var myAccountManager = Cc["@mozilla.org/messenger/account-manager;1"]
	// 		.getService(Ci.nsIMsgAccountManager);
	// 	var myAccount = myAccountManager.FindAccountForServer(msgFolder.server);
	// 	prologue = prologue + "X-Account-Key: " + myAccount.key + "\n";
	// }

	// fix this cleidigh
	// data = escapeBeginningFrom(data, file);
	// data = data.replace(/\nFrom /g, "\n From ");
	// Add the prologue to the EML text
	data = prologue + data + "\n";

	return data;
}


worker1('test');