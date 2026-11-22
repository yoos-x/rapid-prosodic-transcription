function addToLog(type, value) {
    let logitem = {};
    logitem.timestamp = Date.now();
    logitem.caretpos = markItems.getCaretPos();
    logitem.context = "audio";
    logitem.message = "";
    logitem.type = type;
    logitem.value = value;
    logitem.playpos = Math.floor(audioPlayer.currentTime * 1000);
    log.push(logitem)
} 