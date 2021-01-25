function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function download(strData, strFileName, strMimeType) {
    var D = document,
        A = arguments,
        a = D.createElement("a"),
        d = A[0],
        n = A[1],
        t = A[2] || "text/plain";

    //build download link:
    a.href = "data:" + strMimeType + "charset=utf-8," + escape(strData);


    if (window.MSBlobBuilder) { // IE10
        var bb = new MSBlobBuilder();
        bb.append(strData);
        return navigator.msSaveBlob(bb, strFileName);
    } /* end if(window.MSBlobBuilder) */



    if ('download' in a) { //FF20, CH19
        a.setAttribute("download", n);
        a.innerHTML = "downloading...";
        D.body.appendChild(a);
        setTimeout(function() {
            var e = D.createEvent("MouseEvents");
            e.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            a.dispatchEvent(e);
            D.body.removeChild(a);
        }, 66);
        return true;
    }; /* end if('download' in a) */



    //do iframe dataURL download: (older W3)
    var f = D.createElement("iframe");
    D.body.appendChild(f);
    f.src = "data:" + (A[2] ? A[2] : "application/octet-stream") + (window.btoa ? ";base64" : "") + "," + (window.btoa ? window.btoa : escape)(strData);
    setTimeout(function() {
        D.body.removeChild(f);
    }, 333);
    return true;
}

async function extractStats(sender,exp_id,duration) { 
    console.log("sandy received "+sender);
    var dur=duration;
    var expnum=exp_id;
    console.log("*********** exp:"+ expnum+" duration:"+dur+"*********************\n");
    if(sender==="receiver"){ 
    	frameWidth=document.getElementById("frameWidth");
	frameHeight=document.getElementById("frameHeight");
	framesPerSecond=document.getElementById("framesPerSecond");
	framesDropped=document.getElementById("framesDropped");
	nackCount=document.getElementById("nackCount");
	packetsReceived=document.getElementById("pps");
	bytesReceived=document.getElementById("bps");
	packetsLost=document.getElementById("packetsLost");    
    	result="Time frameWidth frameHeight framesPerSecond framesDropped nackCount packetsReceived bytesReceived packetsLost"
	let duration = dur;//sandy: Duration you want to collect
    	var i;
	var count=0;
	var fw;
	var fh;
	var fps;
	var fd;
	var nak;
	var pps;
	var bps;
	var pl;
	var line;
    	for (i=0; i<duration; i++) {
		if(frameWidth) {fw=frameWidth.innerText;}
		else {fw="Undef";}
		if(frameHeight) {fh=frameHeight.innerText;}
		else {fh="Undef";}
		if(framesPerSecond) {fps=framesPerSecond.innerText;}
		else {	fps="undef";}
		if(framesDropped) {fd=framesDropped.innerText;}
		else {fd="undef";}
		if(nackCount) {nak=nackCount.innerText;}
		else {nak="undef";}
		if(packetsReceived) {pps=packetsReceived.innerText;}
		else {pps="undef";}
		if(bytesReceived) {bps=bytesReceived.innerText;}
		else {bps="undef";}
		if(packetsLost) {pl=packetsLost.innerText;}
		else {pl="undef";}
        	line = "" +count++ +" "+fw+" "+fh+" "+fps+" "+fd+" "+nak+" "+pps+" "+bps+" "+pl+"\n";
		result = result + line;
		console.log(line);
		await sleep(1000);
    	}
   	var filename='stats_receiver_'+expnum+'.txt';
    	download(result, filename, 'text/plain');
    }else if(sender==="sender"){
	let duration = dur;//sandy: Duration you want to collect
	var rttp=document.getElementById("rtt");
	var i;
	var count=0;
	result="Time RTT\n";
	var rt;
	for (i=0; i<duration; i++) {
		if(rttp)
			rt=rttp.innerText
		else
			rt="undef"
		line = "" +count++ +" "+rt+"\n";
		result = result + line;
		console.log(line);
		await sleep(1000);	
	}
	download(result, 'stats_sender.txt', 'text/plain');
    }
}

