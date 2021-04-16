console.log('Script loaded !');

const consoleBox = document.getElementById('content');
const inputField = document.getElementById('inputField');

const mobileInputField = document.getElementById('mobileInput');

const customWindowWrapper = document.getElementById('customWindowWrapper');
const customWindowName = document.getElementById('customWindowName');
const customWindowContent = document.getElementById('customWindowContent');

const languageList = ['en', 'fr'];

const lineSpawnTime = 10;

let langData = {};

let writingInProgress = false;

const execCodeTable = {
    "lang": async newLang => await changeLanguage(newLang),
    "clear": () => consoleBox.innerHTML = "",
    "portfolio": () => spawnCustomWindow('portfolio', generatePortfolioContent()),
    "help": () => generateHelpMessage()
}

inputField.addEventListener('keyup', async function onEvent(e) {
    if (e.key === "Enter") {
        const value = inputField.value.split(' ');
        executeCommand(value);
    }
});

async function executeCommand(value) {
    if(writingInProgress === true) return;

    const command = value.shift();
    const args = value;

    inputField.value = '';

    await addTextToConsole(`$2e5431${command} ${args.join(" ")}\n`);

    if (langData.commands[command]?.executable == true) {
        let res = await execCodeTable[langData.commands[command].execCode](...args);
        await addTextToConsole(res);
    } else {
        let content = langData.commands[command] ? langData.commands[command].content : langData.unknownCmd;
        await addTextToConsole(content);
    }
        
    await addTextToConsole(`\n${langData.promptName}`);
}

async function addTextToConsole(text, customClass) {
    writingInProgress = true;
    let stringTable = text.split(/(?=\n)/);
    let color = '000';
    for(let line of stringTable) {
        line = line.replace('\n', '<br/>');
        if (line.startsWith('$')) {
            color = line.slice(1, 7);
            line = line.substring(7, line.length);
        }
        consoleBox.innerHTML += `<span class="${customClass ? customClass : ''}" style="color: #${color};">${line}</span>`;
        await sleep(lineSpawnTime);
        consoleBox.scrollTop = consoleBox.scrollHeight;
    }
    writingInProgress = false;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchLangData(lang) {
    let res = await fetch(`./langs/${lang}.json`);

    return res.json();
}

function checkUserPreferedLanguage() {
    let preferedLanguage = 'en';

    for(let lang of window.navigator.languages) {
        if (languageList.includes(lang)) {
            preferedLanguage = lang;
            break;
        }
    }

    console.log(`User prefered language is : ${preferedLanguage}`);

    return preferedLanguage;
}

async function changeLanguage(newLang) {
    let cmd = getCommandDisplayName('lang');

    if (!languageList.includes(newLang)) return langData.commands[cmd].fail;

    langData = await fetchLangData(newLang);

    cmd = getCommandDisplayName('lang');

    return langData.commands[cmd].success;
}

function getCommandDisplayName(execCode) {
    let newCommandName = '';
    for(let cmd in langData.commands) {
        if (langData.commands[cmd]?.execCode == execCode) {
            newCommandName = cmd;
            break;
        }
    }
    return newCommandName;
}

function spawnCustomWindow(execCode, content) {
    let commandInfos = langData.commands[getCommandDisplayName(execCode)];

    customWindowName.innerHTML = commandInfos.windowInfos.name;

    customWindowContent.innerHTML = "";
    customWindowContent.appendChild(content);

    customWindowWrapper.classList.remove('hide');

    return commandInfos.success;
}

function closeCustomWindow() {
    customWindowWrapper.classList.add('hide');
}

function generatePortfolioContent() {
    let content = langData.commands[getCommandDisplayName('portfolio')].windowInfos.content;

    let result = document.createElement('div');
    result.style.display = "flex";
    result.style.flexWrap = "wrap";

    for(let card of content) {
        let cardEle = document.createElement('div');
        cardEle.classList.add('card');
        cardEle.onclick = () => window.open(card.redirectLink, '_blank').focus();

        let imageWrapper = document.createElement('div');
        imageWrapper.classList.add('card-image-wrapper');
        let image = document.createElement('img');
        image.src = card.imageUrl;
        imageWrapper.appendChild(image);
        cardEle.appendChild(imageWrapper);

        let title = document.createElement('h3');
        title.innerHTML = card.name;
        cardEle.appendChild(title);

        let desc = document.createElement('p');
        desc.innerHTML = card.description;
        cardEle.appendChild(desc);

        result.appendChild(cardEle);
    }

    return result;
}

function generateHelpMessage() {
    let helpMessage = langData.commands[getCommandDisplayName('help')].firstSentence;

    for(let command in langData.commands) {
        if (langData.commands[command].displayInHelp === false) continue;

        helpMessage += `&nbsp;<b>${command}</b> `;

        if (langData.commands[command].hasArgs === true) {
            for(let arg of langData.commands[command].args) {
                helpMessage += `<⁣⁣&#8291;${arg[0]}⁣⁣&#8291;> `;
            }
        }

        helpMessage += `: ${langData.commands[command].description}`;
    }

    return helpMessage;
}

function addCommandsToMobileInputField() {
    mobileInputField.innerHTML = "";

    for(let command in langData.commands) {
        let selector = document.createElement('div');
        selector.classList.add('mobile-input-option');
        selector.innerHTML = command;
        if (langData.commands[command].hasArgs === true) {
            selector.onclick = () => chooseBetweenArgs(command);
        } else {
            selector.onclick = () => executeCommand([command]);
        }

        mobileInputField.appendChild(selector);
    }
}

function chooseBetweenArgs(command, argNumber, args) {
    mobileInputField.innerHTML = "";

    if (langData.commands[command].args.length > 1) {
        argNumber = argNumber == undefined ? 0 : argNumber;
        args = args == undefined ? [] : args;

        for(let arg of langData.commands[command].args[argNumber][1]) {
            let selector = document.createElement('div');
            selector.classList.add('mobile-input-option');
            selector.innerHTML = arg;

            if (langData.commands[command].args.length == argNumber+1) {
                console.log(args);
                selector.onclick = async () => {args.push(arg); await executeCommand([command, ...args]); addCommandsToMobileInputField()};
            } else {
                selector.onclick = () => {args.push(arg); chooseBetweenArgs(command, argNumber+1, args)};
            }
    
            mobileInputField.appendChild(selector);
        }
    } else {
        for(let arg of langData.commands[command].args[0][1]) {
            let selector = document.createElement('div');
            selector.classList.add('mobile-input-option');
            selector.innerHTML = arg;
            selector.onclick = async () => {await executeCommand([command, arg]); addCommandsToMobileInputField()};
    
            mobileInputField.appendChild(selector);
        }
    }
    
    
}

(async () => {
    langData = await fetchLangData(checkUserPreferedLanguage());

    inputField.placeholder = langData.inputFieldPlaceholder;

    addCommandsToMobileInputField()

    await addTextToConsole(langData.asciiName, "ascii-name");
    await addTextToConsole(langData.welcomingText);
    await addTextToConsole(langData.promptName);
})();