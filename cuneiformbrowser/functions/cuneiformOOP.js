/*TODO
 * need following info to separate php from JS
 *
 * "<title>Edition ".$_SESSION["imageName"]."</title>"; <- in matlabInfo
 *
 * $imagefile = _IMAGESPATH_.($xmlImages->image[$_SESSION["imageID"]]->file);
	$imagesize =  getimagesize($imagefile.".jpg");
	$width = $imagesize[0];
	$height = $imagesize[1];

 *  "<svg width=\"$width\" height=\"$height\"  class=\"content\">
		   <g id=\"svgMaster\">
		 <image xlink:href=\"$imagefile.jpg\" draggable=\"true\" x=\"0\" y=\"0\" height=\"$height\" width=\"$width\" id=\"image\" title=\"$_SESSION[imageID]\">
		 </svg>" ;

		 	$imagefile = _IMAGESPATH_.($xmlImages->image[$_SESSION["imageID"]]->file);
	$imagesize =  getimagesize($imagefile.".jpg");
	$width = $imagesize[0];
	$height = $imagesize[1];
	echo "<image xlink:href=\"$imagefile.jpg\" draggable=\"true\" x=\"0\" y=\"0\" height=\"$height\" width=\"$width\" id=\"thumb\" title=\"$_SESSION[imageID]\">
	</svg>" ;

		echo "<script> var autoload = $GLOBALS[annotation];
					var statusAnnotations = \"$GLOBALS[statusAnnotations]\";
					var annotationsVersions = $GLOBALS[versions];
					var urlThumbHOG = \""._RESULTS_.$_SESSION["user"]."HOG.jpg\";
					var urlThumb = \""._RESULTS_.$_SESSION["user"]."thumbs.jpg\"; </script>";

 *  */

var xmlns = "http://www.w3.org/2000/svg";
var x = $("#image").offset().left;
var y = $("#image").offset().top;
var svgElement = document.getElementById("image");
svgElement.ondragstart = function() { return false; }; // to not conflict with the rectangles' dragging
svgElement.addEventListener("click", imageClicked);
svgElement.addEventListener("mouseover", imageOver);
var boxes = [ null ];
var lines = [0];
var zoom = 1;
var zoomInverse = 1;
var activeRectangle;
var mainInfo;
var verbose = false;
var streamChange = false;
var dictionary = Array(); // Label's dictionary!
var windowObjectReference = null;
var nextLabel = null;
var usedLabels = Array();
var selectedSignClass = "";

var meta;

var detectionInfo = {};
detectionInfo.detectedSigns = new Set();
detectionInfo.ID = 0;
detectionInfo.searchedSigns = [];
detectionInfo.algorithms = [];

var generalInfo = {};
generalInfo.imageID = "";
generalInfo.collectionID = "";
generalInfo.groupID = "";
generalInfo.detectionID = "";
generalInfo.feedbackID = "";

var imageHeight = 100;
var imageWidth = 100;


// FLAGS
var clickFlag = false;
var editFlag = false;
var selectFlag = false;
var annotationsLoaded = false;
var editName = false;
var noEdit = false;
var train = false;
var colorize = true;
var resizeMode = false;
var saveAllowed = true; // To now allow saving in some cases TODO
var backupAvailable = false;
var verboseBuffer = "";
var dictUpdateOpen = false;
var draw_line = false;
var mode = 'boxes';

// Config, probably will be loaded by php
var selectedColor = "red";
var sameValue = "blue";
var defaultColor = "green";
var noValue = "maroon";
var tabletName = "VATsoemthingsomething";
var folderName = "KileS";
var archived = false;
var resultsDirectory = "";
var opacityValue = 0.5;

// Constants, to make things readable...
var _ENTER_ = 13;
var _DEL_ = 46;
var _ESC_ = 27;
var _TAB_ = 9;
var _A_ = 65;
var _H_ = 72;
var _E_ = 69;
var _L_ = 76;
var _N_ = 78;
var _ADD_ = 107;
var _EQL_ = 187;
var _DOT_ = 190;
//Not sure... var _ADD2_ = 171; 
var _HASH_ = 163;
var _MULT_ = 106;
var _COMMA_ = 188;

var trackChanges = new changesTracker();
var changesLog = new changeLog();

var dictOrdered = Array();
var aDictUnicode = Array();

var oldDetectionsWindow = {};

$(document).on("keydown", reactKeyboard);

$(window).load(startingSetup);



// Starting setup: adjust image zoom, load important infos.
function startingSetup() {
	// These functions need to be initialized
	setPopUp();
	defaultMode();

	// set the colors of the help panel
	document.getElementById("annotationColor").style.backgroundColor = defaultColor;
	document.getElementById("nonAnnotationColor").style.backgroundColor = noValue;
	document.getElementById("sameColor").style.backgroundColor = sameValue;
	document.getElementById("selectedColor").style.backgroundColor = selectedColor;

	document.getElementById("dictionaryHeader").addEventListener("mousedown", onMouseDownDictionary);
    document.getElementById("dictionary").addEventListener("click", highlightSignFromDictionary);
	detectionInfo = new detection();

	if(offline)
		startUpOffline();  // if we are in offline modus, jsut ignore everything!
	else
	{
	// HEERE LOAD INFO
	var waitForIt = true;
	$.ajax({
		type : "GET",
		url : "matlabInfo.php?infoRequest=startUp",
		dataType : "json",
		async : false,
		cache : false,
		error : function() {
			console.log("error calling for startup Info!");
			return;
		},
		success : function(result) {
			tabletName = result['imageName'];
			imageName = result['imageName'];
			imageFile = result['imageFile'];
			statusAnnotations = result['statusAnnotations'];
			autoload = JSON.parse(result['autoload']);
			imageWidth = result['imageWidth'];
			imageHeight = result['imageHeight'];
			urlThumb = result['resultThumb'];
			urlThumbHOG = result['urlThumbHOG'];
			annotationsVersions = result['version'];
			imageID = result['imageID'];
			waitForIt = false;
			groupID = result['groupNr'];
			collectionID = result['collectionNr'];
			groupName = result['groupName'];
			collectionName = result['collectionName'];
			userName = result['user'];
			page = result['page'];
		//	if(result['metaData']== "none")
		//		metaData = false;
		//	else
		//		metaData = true;
			
			// get view description of tablet segment
			var view_desc = '';
			if (imageFile.search('Obv') >= 0)
				view_desc = 'Obv';
			else if (imageFile.search('Rev') >= 0)
			  	view_desc = 'Rev';

			meta = new metaData();

			var collectionSAAPath = collectionName.toLowerCase().split(" ").join("");

			document.title = "Editor("+userName+"): " + tabletName+' Collection: '+collectionName+' Group: '+groupName;
			if( tabletName[0] == 'P')
				document.getElementById('tabletName').innerHTML = '<b><a target="_blank" href="https://cdli.ucla.edu/'+tabletName+
					'">'+tabletName+view_desc+'</a></b><br><a target="_blank" href="http://oracc.museum.upenn.edu/saao/'+collectionSAAPath+"/"+tabletName+'">SAA link</a>';
			else
				document.getElementById('tabletName').innerHTML = '<b>'+tabletName+'</b>';

			document.getElementById('containerSVG').setAttribute("width",imageWidth);
			document.getElementById('containerSVG').setAttribute("height",imageHeight);
			svgElement.setAttribute("width",imageWidth);
			svgElement.setAttribute("height",imageHeight);
			svgElement.setAttribute('xlink:href',imageFile+".jpg");
			document.getElementById('thumb').setAttribute("width",imageWidth);
			document.getElementById('thumb').setAttribute("height",imageHeight);
			document.getElementById('thumb').setAttribute("height",imageHeight);
			document.getElementById('thumb').setAttribute('xlink:href',imageFile+".jpg");

			document.getElementById('backStart').addEventListener('click',function(){window.location='start.php?group='+groupID+'&collection='+collectionID+'&selection=true&page='+page;});

			var sel = document.getElementById("backupSelect");

			if (statusAnnotations != "done") {
				for ( var i = 1; i < annotationsVersions; i++) {
					var opt1 = document.createElement("option");
					opt1.value = i + 1;
					opt1.text = "Version " + i;
					sel.add(opt1, sel.options[1]);
				}
			} else
				sel.style.display = "none";
			// Adjust zoom to let image fit on screen
			if (imageWidth < window.outerWidth) {
				zoom = 100;
			} else if (imageWidth * 0.75 < window.outerWidth) {
				zoom = 75;
			} else if (imageWidth * 0.5 < window.outerWidth) {
				zoom = 50;
			} else
				zoom = 25;

			document.getElementById("zoom").value = zoom;
			resizeEverything(zoom);

			dictionaryPrepare();

			if (statusAnnotations == "done") {
				archived = true;
				noEditMode();
			}

			if (statusAnnotations == "none")
				document.getElementById("load").className += " disabled";

			// experimetnal
			if (typeof (autoload) != "undefined")
				if (autoload)
					{
					loadAnnotations();
					}
			timer = window.setTimeout(ping, 720000);

			$.ajax({
				type : "GET",
				url : "matlabInfo.php?infoRequest=currentInfo",
				dataType : "json",
				async : false,
				cache : false,
				error : function() {
					console.log("error calling for Info!");
					return;
				},
				success : function(result) {
					mainInfo = result;
					//tabletName = mainInfo['imageName'];
					backupAvailable = mainInfo['backup'] && mainInfo['backupID']==imageID;
					// Check which algorithms are available
					if(!mainInfo['algorithms']['multi'])
						{
						document.getElementById('multi').disabled = true;
						document.getElementById('multi').checked = false;
						}
					// Check if detections' options are available:
					if(mainInfo['detectionOptions'] != null)
						{
						for ( var i = 0; i < mainInfo['detectionOptions'].length; i++)
						{
							var sel = document.getElementById('imageOptions');
							var opt1 = document.createElement("option");
							opt1.value = mainInfo['detectionOptions'][i];
							opt1.text = mainInfo['detectionOptions'][i];
							sel.add(opt1, sel.options[1]);
						}
					}
					else
						document.getElementById('options').style.display = 'none';

					if(mainInfo['continueProcess'])
						{
						// Show the new dialog
						document.getElementById('matlabOutput').value = "Picking up stream...\n";
						setPopUp('matlabStream');

						// Now call the streaming function in one sec!
						setTimeout('streamMatlab()', 1000);
						}
					if(mainInfo['loadBackup'])
						{
						//loadBackupDetection();
						 restoreBackup();
						}
					else
					if(backupAvailable)
						{
						document.getElementById("loadBackup").style='inline-block';

						}
				}
			});

			$("#overlay").remove();
			oldDetectionsWindow = new interfaceWindow(30, 10, "oldDetections");
			oldDetectionsWindow.addButtons(oldDetections);
			oldDetectionsWindow.addContent();

			// GET Rid of some variables:
			delete groupName;
			delete collectionName;
			delete userName;
		}
	});
	// HERE WAIT FOR IT

	// Here set it!
    



	// Set all button handles!




	}

    dragDictionary(document.getElementById("testDIV"));


}

function startUpOffline()
{
	// set dummy links
	// hide everything that is not ok
	// TODO in the mode change, check for offline!
	document.title = "Offline Editor";
	document.getElementById('tabletName').innerHTML = '<b>Offline Editor</b>';
	document.getElementById("online").style.display = "none";
	//document.getElementById("localImage").style.display = "block";
	//document.getElementById("loadLocal").style.display = "none";
	$("#overlay").remove();
	document.getElementById("ping").style.backgroundColor = "red";
}


function loadAnnotations(version) {
	if(statusAnnotations === "none")
		return;

	if (annotationsLoaded)
		{
			console.log('Annotations already loaded');
			return;
		}


	var location = "fetch.php?version=";

	if (arguments.length == 0) {
		location = location + "0";
	} else {
		location = location + version;
	}
	$.ajax({
		type : "GET",
		url : location,
		dataType : "json",
		success : function(result) {
			xmlProcess(result["xml"]);
			confidenceUpdate(0);
			processCSVLines(result["csv"]);
			annotationsLoaded = !annotationsLoaded;
			toggleLoadButtons();
			$("#statusSave").toggleClass("statusAttention");
			trackChanges.edited = true;
			trackChanges.saved();
			if(boxes.length == 1 && mode !== "lines")
				{
					switchModes();
				}
		},
		error : function(xhr, status, errorThrown) {
			console.log("Error: " + errorThrown);
			console.log("Status: " + status);
			console.dir(xhr);
		},
		async : true,
		cache : false
	});
	return;
}

function loadResults(id) {
	if (annotationsLoaded)
		return;
	document.getElementById('closeStream').style.display = "none";
	verboseBuffer = "";

	if(id != "")
		//var location = "loadresultsID.php?detectionID="+id;
		var location = "loadresultsCNN.php?network_version="+id;
	else
		//var location = "loadresultsID.php";
		var location = "loadresultsCNN.php";
	$.ajax({
		type : "GET",
		url : location,
		dataType : "json",
		success : function(result) {
			jsonProcess(result);
			//loadModels();
			setTraining();
			if (colorize)
				colorizeConfidence();
            confidenceUpdate(0.3);
		},
		error : function(xhr, status, errorThrown) {
			console.log("Error: " + errorThrown);
			console.log("Status: " + status);
			console.dir(xhr);
		},
		async : true,
		cache : false
	});
}

function loadModels() {

	var location = "matlabInfo.php?infoRequest=nearestModels";
	$.ajax({
		type : "GET",
		url : location,
		dataType : "json",
		success : function(result) {
			modelsProcess(result);
		},
		error : function(xhr, status, errorThrown) {
			console.log("Error: " + errorThrown);
			console.log("Status: " + status);
			console.dir(xhr);
		},
		async : true,
		cache : false
	});
}

function resizeEverything(zoomFactor) {
	zoomInverse = 100 / zoomFactor;
	zoomVal = zoomFactor / 100;

	document.getElementById("svgMaster").setAttribute("transform",
			"scale(" + zoomVal + ")");
	var containerSVG = document.getElementById('containerSVG')
	containerSVG.setAttribute("width", imageWidth * zoomVal);
	containerSVG.setAttribute("height", imageHeight * zoomVal);
	window.scrollTo(0, 0); // TODO scroll to same position using scrolltop and
							// scrollleft (jquery) and the zoomfactor
}

function boundingBox(x, y, id) {
	this.id = id;
	this.xmin = x;
	this.ymin = y;
	this.xmax = x + 1;
	this.ymax = y + 1;
	this.symbol = "000";
	this.confidence = 1;
	this.thumbHeight = 0;
	this.thumbXStart = 0;
	this.thumbWidth = 0;
	this.readableSymbol = "N/A";
	this.show = 1;
	this.status = "intact";
}

function line(x, y, id){
	this.id = id;
	this.segments = Array();
	this.group = document.createElementNS(xmlns, "g");

	this.group.setAttribute("id", "line_"+id);
	document.getElementById("lines_group").appendChild(this.group);

	this.group.addEventListener("click", function(){this.select();}.bind(this));
	this.segments.push(new line_segment(x,y, this.group));

}

line.prototype.addSegment = function(){
	var segment = this.segments[this.segments.length -1];
	segment.svg.setAttribute("x2", segment._x2);
	segment.svg.setAttribute("y2", segment._y2);
	segment.svg.setAttribute("stroke", "green");
	segment.svg.removeAttribute("stroke-dasharray");
	this.segments.push(new line_segment(segment._x2,segment._y2, this.group));
}

line.prototype.clearLast = function(){
	var segment = this.segments.pop();
	segment.removeLast();
	// if no more segments, remove line altogether.
	if(this.segments.length == 0)
		{
			lines.pop();
			this.group.remove();
		}
}

line.prototype.erase = function(){

	lines.splice(lines.indexOf(this), 1);
	this.group.remove();
	trackChanges.changed();
}

line.prototype.select = function(){

	if(draw_line)
		return;

	if(lines[0] != 0)
		lines[lines[0]].deselect();

	lines[0] = lines.indexOf(this);

	for(var i = 0; i < this.segments.length; i++)
		{
			this.segments[i].svg.setAttribute("stroke-dasharray", "5,5");
		}
}

line.prototype.deselect = function(){

	lines[0] = 0;

	for(var i = 0; i < this.segments.length; i++)
	{
		this.segments[i].svg.removeAttribute("stroke-dasharray");
	}
}

line.prototype.getCSV = function(){

	var temp = Array();
	var segment = this.segments[0];
	var csv = this.id + "," + segment._x1 + "," + segment._y1 + "\n" + this.id + "," + segment._x2 + "," + segment._y2;
	temp.push(csv);

	for(var i = 1; i < this.segments.length; i++)
		{
			var segment = this.segments[i];
			var csv = this.id + "," + segment._x2 + "," + segment._y2;
			temp.push(csv);
		}

	return temp.join('\n');
}

function line_segment(x, y, parent) {
		this._x1 = Math.round(x);
		this._y1 = Math.round(y);

		this._x2 = x+1;
		this._y2 = y+1;

		this._visible = true;

		// create SVG element

		var elem = document.createElementNS(xmlns, "line");

		elem.setAttribute("x1", this._x1);
		elem.setAttribute("y1", this._y1);
		elem.setAttribute("x2", this._x2-1);
		elem.setAttribute("y2", this._y2-1);
		elem.setAttribute("stroke-width", 3);
		elem.setAttribute("stroke", "magenta");
		elem.setAttribute("stroke-dasharray", "5,5");
		elem.setAttribute("vector-effect", "non-scaling-stroke");
		parent.appendChild(elem);
		this.svg = elem;

}

line_segment.prototype.removeLast = function(){
	this.svg.remove();

}
Object.defineProperty(line.prototype, "x", {
	set: function(value){
		this.segments[this.segments.length-1]._x2 = value;
		this.segments[this.segments.length-1].svg.setAttribute("x2", value-1);

	}

});
Object.defineProperty(line.prototype, "y", {
	set: function(value){
		this.segments[this.segments.length-1]._y2 = value;

		this.segments[this.segments.length-1].svg.setAttribute("y2", value-1);
	}

});

function loadLines(data){

	return;

}
/*Object.defineProperty(line_segment.prototype, "y", {
	set: function(value){
		this._y2 = value;

		this.svg.setAttribute("y2", this._y2);
	}

});*/

boundingBox.prototype.xmlBox = function(xmlBox, train) {
	this.id = $(xmlBox).find('name').text();
	this.xmin = parseFloat($(xmlBox).find('xmin').text());
	this.ymin = parseFloat($(xmlBox).find('ymin').text());
	this.xmax = parseFloat($(xmlBox).find('xmax').text());
	this.ymax = parseFloat($(xmlBox).find('ymax').text());
	this.symbol = $(xmlBox).find('symbol').text();
	this.symbol = $(xmlBox).find('symbol').text();
	//TODO
	// conservation status
	var status = $(xmlBox).find('conservation').text();
	if(status)
	{
		this.status = status;
	}
	this.readableSymbol = $(xmlBox).find('hrsymbol').text();
	if(this.readableSymbol == "" || this.readableSymbol.toLowerCase() == "na") // no saved human readable label, get default one
		{
			var newName = parseInput(this.symbol);
			if (newName != null)
				{
					this.readableSymbol = newName.newName;
					this.unicodeName = unicodize(this.readableSymbol);
				}

		}
	else
		this.unicodeName = unicodize(this.readableSymbol);

	if (train) {
		this.confidence = $(xmlBox).find('confidence').text();
	}
};

boundingBox.prototype.jsonBox = function(element) {
	if(element.hasOwnProperty('name'))
		this.id = element.name;
	else
		this.id = element.id;

	this.xmin = element.xmin;
	this.ymin = element.ymin;
	this.xmax = element.xmax;
	this.ymax = element.ymax;
	this.symbol = ("000" + (element.symbol)).slice(-3);

	if (typeof element.readableSymbol != 'undefined')
		{
		this.readableSymbol = element.readableSymbol;
		this.unicodeName = unicodize(this.readableSymbol);
		}
	else
		{
		this.readableSymbol= "N/A";
		this.unicodeName  = "N/A";
		}
	if (typeof element.confidence != 'undefined') {
		this.confidence = element.confidence;
		this.basic = element.basic;
		this.ngram = element.ngram;
		this.ngramlr = element.ngramlr;
		this.ngramrl = element.ngramrl;
		if(typeof element.reviewed == 'undefined')  // A normal bounding box, not a saved detection
			{
			this.reviewed = false; // Was this reviewed?
			this.fp = false; // false positive?
			this.correction = this.id; // actual sign -> 000 if not a sign at all!

			var newName = parseInput(this.symbol);
			if (newName != null)
				{
					this.readableSymbol = newName.newName;
					this.unicodeName = unicodize(this.readableSymbol);
				}
			}
		else
			{	// a saved detection
			this.reviewed = element.reviewed; // Was this reviewed?
			this.fp = element.fp; // false positive?
			this.correction = element.correction; // actual sign -> 000 if not a sign at all!
			}

	}
};

boundingBox.prototype.jsonThumbs = function(detection, model) {
	//array("height"=>$ymax, "XStart"=>$xpos, "width"=>$width, "xHOG"=> $xHOG);
//	this.thumbHeight = element.height;
//	this.thumbXStart = element.XStart;
//	this.thumbWidth = element.width;
//	this.thumbHOG = element.xHOG;

	this.thumbName = "thumb_" + detection + "_model" + model + ".jpg";
	this.HOGName = "thumb_" + detection + "_model" + model + "_HOG.jpg";
};

boundingBox.prototype.svgBox = function() {
	var x = Math.round(this.xmin);
	var y = Math.round(this.ymin);
	var width = Math.round(this.xmax) - x;
	var height = Math.round(this.ymax) - y;
	var elem = document.createElementNS(xmlns, "rect");

	elem.setAttribute("id", this.id);
	elem.setAttribute("x", x);
	elem.setAttribute("y", y);
	elem.setAttribute("width", width);
	elem.setAttribute("height", height);
	elem.setAttribute("name", this.symbol);
	if (this.symbol != "000")
		elem.setAttribute("stroke", defaultColor);
	else
		elem.setAttribute("stroke", noValue);
	elem.setAttribute("stroke-width", 1);
	elem.setAttribute("fill", "none");
	elem.setAttribute("vector-effect", "non-scaling-stroke");
    elem.classList.add(this.status);
	document.getElementById("boxes_group").appendChild(elem);
	this.svg = elem;
};
boundingBox.prototype.setMax = function(width, height) {
	this.xmax = +this.xmin + +width;
	this.ymax = +this.ymin + +height;
};

boundingBox.prototype.boxToXML = function(newXML) {
	var sign = newXML.createElement("object");
	var newNode = newXML.createElement("name");

	newNode.appendChild(newXML.createTextNode(this.id));
	sign.appendChild(newNode);

	// Symbol <symbol>511</symbol>

	newNode = newXML.createElement("symbol");
	newNode.appendChild(newXML.createTextNode(this.symbol));
	sign.appendChild(newNode);

	// bndbox
	newNode = newXML.createElement("bndbox");
	var x = newXML.createElement("xmin");
	var y = newXML.createElement("ymin");

	x.appendChild(newXML.createTextNode(this.xmin));
	y.appendChild(newXML.createTextNode(this.ymin));

	newNode.appendChild(x);
	newNode.appendChild(y);

	x = newXML.createElement("xmax");
	y = newXML.createElement("ymax");

	x.appendChild(newXML.createTextNode(this.xmax));
	y.appendChild(newXML.createTextNode(this.ymax));

	newNode.appendChild(x);
	newNode.appendChild(y);

	sign.appendChild(newNode);

	// center
	newNode = newXML.createElement("center");
	x = newXML.createElement("xc");
	y = newXML.createElement("yc");

	x.appendChild(newXML.createTextNode((parseFloat(this.xmin) + parseFloat(this.xmax)) / 2));
	y.appendChild(newXML.createTextNode((parseFloat(this.ymin) + parseFloat(this.ymax)) / 2));

	newNode.appendChild(x);
	newNode.appendChild(y);

	sign.appendChild(newNode);

	// coordpos
	newNode = newXML.createElement("coordpos");
	var rowNode = newXML.createElement("row");
	var colNode = newXML.createElement("col");

	rowNode.appendChild(newXML.createTextNode("1"));
	colNode.appendChild(newXML.createTextNode("1"));

	newNode.appendChild(rowNode);
	newNode.appendChild(colNode);

	sign.appendChild(newNode);

	// Human readable symbol

	if(this.readableSymbol != "N/A")
	{
		newNode = newXML.createElement("hrsymbol");
		newNode.appendChild(newXML.createTextNode(this.readableSymbol));
		sign.appendChild(newNode);
	}

	// Conservation status
	newNode = newXML.createElement("conservation");
	newNode.appendChild(newXML.createTextNode(this.status));
	sign.appendChild(newNode);

	return sign;

};

boundingBox.prototype.boxToXMLCorrection = function(newXML) {
	var sign = newXML.createElement("object");
	var newNode = newXML.createElement("name");

	newNode.appendChild(newXML.createTextNode(this.id));
	sign.appendChild(newNode);

	// Symbol <symbol>511</symbol>

	newNode = newXML.createElement("symbol");
if(this.fp) {
	newNode.appendChild(newXML.createTextNode(this.correction));
} else {
	newNode.appendChild(newXML.createTextNode(this.symbol));
}
	sign.appendChild(newNode);

	// bndbox
	newNode = newXML.createElement("bndbox");
	var x = newXML.createElement("xmin");
	var y = newXML.createElement("ymin");

	x.appendChild(newXML.createTextNode(this.xmin));
	y.appendChild(newXML.createTextNode(this.ymin));

	newNode.appendChild(x);
	newNode.appendChild(y);

	x = newXML.createElement("xmax");
	y = newXML.createElement("ymax");

	x.appendChild(newXML.createTextNode(this.xmax));
	y.appendChild(newXML.createTextNode(this.ymax));

	newNode.appendChild(x);
	newNode.appendChild(y);

	sign.appendChild(newNode);

	// center
	newNode = newXML.createElement("center");
	x = newXML.createElement("xc");
	y = newXML.createElement("yc");

	x.appendChild(newXML.createTextNode((parseFloat(this.xmin) + parseFloat(this.xmax)) / 2));
	y.appendChild(newXML.createTextNode((parseFloat(this.ymin) + parseFloat(this.ymax)) / 2));

	newNode.appendChild(x);
	newNode.appendChild(y);

	sign.appendChild(newNode);

	// coordpos
	newNode = newXML.createElement("coordpos");
	var rowNode = newXML.createElement("row");
	var colNode = newXML.createElement("col");

	rowNode.appendChild(newXML.createTextNode("1"));
	colNode.appendChild(newXML.createTextNode("1"));

	newNode.appendChild(rowNode);
	newNode.appendChild(colNode);

	sign.appendChild(newNode);

	// Human readable symbol

	if(this.fp)
	{
		newNode = newXML.createElement("hrsymbol");
		newNode.appendChild(newXML.createTextNode(this.corRead));
		sign.appendChild(newNode);
	} else {
		newNode = newXML.createElement("hrsymbol");
		newNode.appendChild(newXML.createTextNode(this.readableSymbol));
		sign.appendChild(newNode);
	}

	// Conservation status
	newNode = newXML.createElement("conservation");
	newNode.appendChild(newXML.createTextNode(this.status));
	sign.appendChild(newNode);

	return sign;

};

boundingBox.prototype.boxCorrections = function() {
	boxArray = {};
	boxArray['symbol'] = this.symbol;
	boxArray['xmin'] = Math.round(this.xmin);
	boxArray['ymin'] = Math.round(this.ymin);
	boxArray['xmax'] = Math.round(this.xmax);
	boxArray['ymax'] = Math.round(this.ymax);
	boxArray['fp'] = this.fp;
	boxArray['correction'] = this.correction;
	boxArray['reviewed'] = this.reviewed;
	return boxArray;
};

function generateXML(bCorrection) {
	var newXML = document.implementation.createDocument(null, null, null);

	var rootNode = newXML.createElement("annotation");
	var folderNode = newXML.createElement("folder");
	var filenameNode = newXML.createElement("filename");
	var sizeImageNode = newXML.createElement("size");
	var widthNode = newXML.createElement("width");
	var heightNode = newXML.createElement("height");

	// Node size: just the size of the image
	widthNode.appendChild(newXML.createTextNode(imageWidth));
	heightNode.appendChild(newXML.createTextNode(imageHeight));
	sizeImageNode.appendChild(widthNode);
	sizeImageNode.appendChild(heightNode);

	// Node folderNode
	folderNode.appendChild(newXML.createTextNode(folderName));

	// Node tabletNameNode
	filenameNode.appendChild(newXML.createTextNode(tabletName));

	// now start appending things to the root node
	rootNode.appendChild(folderNode);
	rootNode.appendChild(filenameNode);
	rootNode.appendChild(sizeImageNode);

	// compact the boxes' array (the ids are just re-arranged to avoid problems due to erased boxes.
	// Now loop over all the boundingboxes and append them!
	var compactIndex = 1;
	boxes.forEach(function(element, index, array) {
		if (element != null) {
			element.id = compactIndex;
			if(bCorrection) {
				if (element.reviewed && parseInt(element.correction)) {
					rootNode.appendChild(element.boxToXMLCorrection(newXML));
					compactIndex += 1;
				}
			} else {
				rootNode.appendChild(element.boxToXML(newXML));
				compactIndex += 1;
			}
		}
	});

	// append the rootNode to the document

	newXML.appendChild(rootNode);

	// test
	return newXML;

}

function downloadXML() {
	var newXML = generateXML();
	var buffer;
	var XMLS = new XMLSerializer();

	// now, generate downalod link! Using the "download" in case it works.

	var downloadData = new Blob([ XMLS.serializeToString(newXML) ], {
		type : 'text/plain'
	});

	if (buffer !== null) {
		window.URL.revokeObjectURL(buffer);
	}

	buffer = window.URL.createObjectURL(downloadData);
	var date = new Date();
	var link = document.getElementById('downloadlink');
	link.download = tabletName + "_" + date.getFullYear() + "_"
			+ date.getMonth() + "_" + date.getDate() + ".txt";
	link.href = buffer;
	link.onclick = function() {
		setPopUp();
	};
	link.style.display = 'block';

	setPopUp("popSaveLocally");

}

function localAnnotation(doAction) {
	if (doAction == "start") {
		document.getElementById("loadAnnotation").style.display = 'block';
		document.getElementById("fileField").reset();
		return;
	}
	if (doAction == "cancel") {
		document.getElementById("loadAnnotation").style.display = 'none';
		$("#error").text("");
		return;
	}

	var control = document.getElementById("annotationFile");
	var reader = new FileReader();

	reader.readAsText(control.files[0]);
	reader.onload = function(event) {
		var data = event.target.result;
		var parser = new DOMParser();
		var xmlData = parser.parseFromString(data, "application/xml");
		if (xmlData.firstElementChild.nodeName == "parsererror") {
			$("#error").text("Invalid File");
			return;
		}
		document.getElementById("loadAnnotation").style.display = 'none';
		xmlProcess(xmlData);
		trackChanges.changed();
	};
	reader.onerror = function(event) {
		console
				.error("File could not be read! Code "
						+ event.target.error.code);
	};

}

function jsonProcess(jsonResult) {
	// detectionInfo.ID = jsonResult["detectionID"];
	detectionInfo.ID = jsonResult["network_version"];
	detectionInfo.detectedSigns = new Set();
	for ( var i = 0; i < jsonResult['data'].length; i++) {
		var box = new boundingBox();
		box.jsonBox(jsonResult['data'][i]);
		box.svgBox();
		boxes.push(box);
		detectionInfo.detectedSigns.add(box.symbol);
	}

	detectionInfo.searchedSigns = jsonResult["searched"];
	detectionInfo.algorithms = jsonResult["algorithms"];
	detectionInfo.fullInfo = jsonResult["detectionInfo"];
	detectionInfo.all = jsonResult["all"];
	detectionInfo.lines = jsonResult["lines"];
//	updateSignList("detection");

	$("rect").on("mousedown", rectangleMouseDown);
	$("rect").on("mouseover", rectangleOver);
	$("rect").on("mouseover", rectangleOver);
	$("rect").attr("pointer-events", "all");
	document.getElementById("slider").disabled = false;

}

function modelsProcess(results) {

//	// Nearest models stored in the corresponding boxes
//	// resulst[0] are the dimensions for the thumbnails!
//
//	for ( var i = 2; i < results.length; i++) {
//		boxes[i-1].jsonThumbs(results[i]);
//
//	}
//	// Now adjust the Thumbnails!
//	//	array("height"=>$height, "xThumb"=>$xThumb, "xHOG"=>$xHOG, "maxWidth"=>$maxWidth);
//	// "hogThumb":"matlab\/resultsWeb\/tester_13_Jul_2015_12_47_23HOG.jpg"
//	document.getElementById('model').setAttribute('xlink:href',	results[1]['modelThumb']);
//	document.getElementById('hog').setAttribute('xlink:href',	results[1]['hogThumb']);
//	$("#svgModel").attr('width',results[0].maxwidth);
//	$("#svgModel").attr('height' , results[0].height);
//	$("#svgHOG").attr('width' , results[0].maxWidth);
//	$("#svgHOG").attr('height' , results[0].height);
//	$("#model").attr('width' , results[0].xThumb);
//	$("#hog").attr('width' , results[0].xHOG);
//	$("#model").attr('height' , results[0].height);
//	$("#hog").attr('height' , results[0].height);
//	//$("#model").attr('xlink:href', urlThumb);
//	//$("#hog").attr('xlink:href', urlThumbHOG);


	// Nearest models stored in the corresponding boxes
	// resulst[0] are the dimensions for the thumbnails!
	if(results == null)
		return;

	for ( var i = 1; i < results.model.length+1; i++) {
		boxes[i].jsonThumbs(results.detection[i-1],results.model[i-1]);

	}
	// Now adjust the Thumbnails!
	//	array("height"=>$height, "xThumb"=>$xThumb, "xHOG"=>$xHOG, "maxWidth"=>$maxWidth);
	// "hogThumb":"matlab\/resultsWeb\/tester_13_Jul_2015_12_47_23HOG.jpg"
	var modelname = results.directory+"thumb_"+results.detection[1]+"_model"+results.model[1]+".jpg";
	var hogname = results.directory+"thumb_"+results.detection[1]+"_model"+results.model[1]+"_HOG.jpg";

	resultsDirectory = results.directory;

	document.getElementById('model').setAttribute('xlink:href',	modelname);
	document.getElementById('hog').setAttribute('xlink:href',	hogname);
	$("#svgModel").attr('width',results.width);
	$("#svgModel").attr('height' , results.height);
	$("#svgHOG").attr('width' , results.width);
	$("#svgHOG").attr('height' , results.height);
	$("#model").attr('width' , results.width);
	$("#hog").attr('width' , results.width);
	$("#model").attr('height' , results.height);
	$("#hog").attr('height' , results.height);
	//$("#model").attr('xlink:href', urlThumb);
	//$("#hog").attr('xlink:href', urlThumbHOG);


}
// ///////////////////////////////////
// EVENTS HANDLING
// ///////////////////////////////////

function imageClicked(event) {
	// This Function takes care of teh creation of new svg rectangles.
	// It catches the "click" events on teh svg-image and calls the rectangle
	// creation function
	// TODO: nicer tracking of objects than that ugly array
	var svgRectangle;
	unselectSignClass();
	if (!editFlag) // if not in edit mode, ignore the click or deselect the box
	{
		if (selectFlag || lines[0] != 0) {
			unSelect();
			selectFlag = false;
			setPopUp();
		}
		return;
	}

	if (!clickFlag) // if false, no box is being drawn, so create a new one
	{
		clickFlag = !clickFlag;
		document.body.style.cursor = 'nwse-resize';
		document.getElementById("load").className += "disabled";

		// Important: need to distinguish WHAT was clicekd or have 2 functions
		// for that
		// get position jsut substracting absolute position ofmouse from
		// object's corner
		var xSvg = (event.pageX - x) * zoomInverse;
		var ySvg = (event.pageY - y) * zoomInverse;

		if(!draw_line)
		{
			var bB = new boundingBox(xSvg, ySvg, boxes.length);
			bB.svgBox();
			boxes.push(bB);
			activeRectangle = boxes.length - 1;

			// set onMove
			svgRectangle = document.getElementById(activeRectangle);
			svgRectangle.setAttribute("stroke", "orange");
			svgRectangle.addEventListener("click", imageClicked);

			svgElement.addEventListener("mousemove", resizeRectangle);
		}else
		{
			var new_id = (lines.length <= 1) ? 0 : lines[lines.length-1].id+1;
			var segment = new line(xSvg, ySvg, new_id);
			lines.push(segment);
			svgElement.addEventListener("mousemove", moveLine);//.bind(segment);
		}
		if (visible)
			setPopUp();
	} else // if the flag is true, a box is active and being changed. Fix the
			// and store the new box
	{
		if (!draw_line) // if false, no box is being drawn, so create a new one
		{
			svgElement.removeEventListener("mousemove", resizeRectangle);

			svgRectangle = document.getElementById(activeRectangle);
			svgRectangle.removeEventListener("click", imageClicked);
			document.body.style.cursor = 'auto';
			// store the data in the object too

			boxes[activeRectangle].setMax(svgRectangle.getAttribute("width"),
					svgRectangle.getAttribute("height"));

			// check if box is too small or corrupted!
			if( (svgRectangle.getAttribute("width") < 11) || (svgRectangle.getAttribute("height") < 11))
				{
					boxes.pop();
					document.getElementById("boxes_group").removeChild(svgRectangle);
					clickFlag = !clickFlag;
					return;
				}
			if (reactKeyboard.selected == false) {
				editSignPopup(svgRectangle, boxes[activeRectangle]);
			}

			if (boxes[activeRectangle].symbol == 0) {
				svgRectangle.setAttribute("stroke", noValue);
			} else {
				svgRectangle.setAttribute("stroke", defaultColor);
			}
			clickFlag = !clickFlag;

			if (reactKeyboard.selected == true) {
				reactKeyboard.selected == false;
				unSelect();
				setStatic();
				$("rect").on("mousedown", rectangleMouseDown);
			}
			if (resizeMode)
				if(typeof(boxes[activeRectangle]) !="undefined")
					changesLog.resizeBox(activeRectangle, boxes[activeRectangle].xmax,
						boxes[activeRectangle].ymax);
			else
				if(typeof(boxes[activeRectangle]) !="undefined")
					{
					changesLog.newBox(activeRectangle, boxes[activeRectangle].symbol,
						boxes[activeRectangle].xmin, boxes[activeRectangle].xmax,
						boxes[activeRectangle].ymin, boxes[activeRectangle].ymax);
					}

		}else
		{
			lines[lines.length-1].addSegment();
		}
		trackChanges.changed();
	}
}

function moveLine(event){
	segment = lines[lines.length-1];
	var xSvg = (event.pageX - x) * zoomInverse;
	var ySvg = (event.pageY - y) * zoomInverse;
	segment.x = xSvg;
	segment.y = ySvg;
	}

function resizeRectangle(event) {
	event.preventDefault();

	var svgRectangle = document.getElementById(activeRectangle);
	var width = (event.pageX - x) * zoomInverse - boxes[activeRectangle].xmin;
	var height = (event.pageY - y) * zoomInverse - boxes[activeRectangle].ymin;

	svgRectangle.setAttribute("width", width, 1);
	svgRectangle.setAttribute("height", height, 1);
}

function rectangleClicked(event) {

	if (editFlag) {
		imageClicked(event);
		return;
	}
//	temp2 = event;
//	temp3 = $(event.target).attr("id");
//	temp4 = activeRectangle;

	if (!selectFlag || (activeRectangle != $(event.target).attr("id"))) {

		selectRectangle($(event.target).attr("id"));
		return;
	}
	if (activeRectangle == $(event.target).attr("id")) {
		unSelect();
		setPopUp();
		selectFlag = !selectFlag;
	}

}

function selectRectangle(id) {
	if (!selectFlag) {
		selectFlag = !selectFlag;
	} else if (activeRectangle != id) {
		unSelect();
		selectFlag = true;
	}
	if (resizeMode) {
		document.getElementById("infoDefault").style.display = "none";
		document.getElementById("infoEdit").style.display = "block";
	}
	//var a = boxes[id].symbol;
	$("#number").text(boxes[id].symbol);
	activeRectangle = id;
	rectangleClicked.symbol = boxes[id].symbol;

	if (editName) {
		editSignPopup(document.getElementById(activeRectangle),
				boxes[activeRectangle]);
	}

	if (!train) {
		selectSignClass(rectangleClicked.symbol);
		document.getElementById(id).setAttribute("stroke", selectedColor);
		document.getElementById(id).setAttribute("stroke-width", 3);
	} else{
		document.getElementById(id).setAttribute("stroke", "magenta");
		document.getElementById(id).setAttribute("stroke-width", 3);
	}
	var frame = document.getElementById('dictionary');

	if(frame.classList.contains("dictionaryOpen"))  {
        id = "row" + ("000"+rectangleClicked.symbol).slice(-3);
        if(document.getElementById(id) != null)
            document.getElementById(id).scrollIntoView();
    }
	// setThumbnail(event);

}

function selectSignClass(signClassId) {

	var aAllRectangles;
	aAllRectangles = document.querySelectorAll(`[name='${signClassId}']`);
	aAllRectangles.forEach(function(node) {
		node.setAttribute("stroke", sameValue);	
	});
	selectedSignClass = signClassId;
}

function unselectSignClass() {

	var sUseColor;

	if(selectedSignClass !== "")
	{
		aAllRectangles = document.querySelectorAll(`[name='${selectedSignClass}']`);
		if(train) {
			if(editName) {
				colorizeCorrections();		
			} else {
			
				unSelectWithScore(aAllRectangles);
			}
		} else {
			aAllRectangles.forEach(function(node) {
				if (boxes[node.getAttribute("id")].symbol != "000")
					var color = defaultColor;
				else
					var color = noValue;
				node.setAttribute("stroke", color);	
				node.setAttribute("stroke-width", 1);
			});
		}	
		
	}

	// small check in case we are in detection mode with a selected rectangle
    if(mode == "boxes") {
    	aAllRectangles = document.querySelectorAll("[stroke='magenta']");
	    unSelectWithScore(aAllRectangles);
    }
}

function unSelectWithScore(aAllRectangles) {
	aAllRectangles.forEach(function(node) {
		var hue = Math.round(boxes[node.getAttribute("id")].confidence * 100);
		node.setAttribute("stroke", "hsla(" + hue + ",100%,50%,1)");	
		node.setAttribute("stroke-width", 1);
	});
}

function rectangleMouseDown(event) {

	if (editFlag) {
		imageClicked(event);
		return;
	}

	if (event.target.id == "image") // if the image was clicked, bubble up,
									// maybe a rectangle was clicked!
		return;

	rectangleMouseDown.moved = 0;
	rectangleMouseDown.up = 0;
	rectangleMouseDown.click = true;
	rectangleMouseDown.color = $(event.target).attr("stroke");
	$(event.target).attr("stroke", selectedColor);
	$("rect").attr("pointer-events", "none");
	// $(event.target).attr("pointer-events","all");
	// $(event.target).on("mouseup", rectangleMouseUp);
	// timerStarter = window.setTimeout(function() {
	//
	rectangleMouseDown.current = $(event.target).attr("id");
	rectangleMouseDown.event = event;
	//
	var xSvg = (event.pageX - x) * zoomInverse;
	var ySvg = (event.pageY - y) * zoomInverse;
	//
	rectangleMouseDown.xOffset = boxes[rectangleMouseDown.current].xmin - xSvg;
	rectangleMouseDown.yOffset = boxes[rectangleMouseDown.current].ymin - ySvg;
	//
	$("image").on("mouseup", rectangleMouseUp);
	$("image").on("mousemove", rectangleMouseMove);
	document.body.style.cursor = 'move';
	//
	// }, 5000);
}

function rectangleMouseMove(event) {
	if(noEdit)
		return;
	rectangleMouseDown.click = false;
	var xSvg = (event.pageX - x) * zoomInverse;
	var ySvg = (event.pageY - y) * zoomInverse;
	var svgRectangle = document.getElementById(rectangleMouseDown.current);
	rectangleMouseDown.moved++;
	boxes[rectangleMouseDown.current].xmin = xSvg + rectangleMouseDown.xOffset;
	boxes[rectangleMouseDown.current].ymin = ySvg + rectangleMouseDown.yOffset;
	boxes[rectangleMouseDown.current].setMax(
			svgRectangle.getAttribute("width"), svgRectangle
					.getAttribute("height"));
	svgRectangle.setAttribute("x", xSvg + rectangleMouseDown.xOffset);
	svgRectangle.setAttribute("y", ySvg + rectangleMouseDown.yOffset);
}

function rectangleMouseUp(event) {

	// if(event.handled !== true) //
	// http://sholsinger.com/2011/08/prevent-jquery-live-handlers-from-firing-multiple-times
	// thanks!
	// {
	document.body.style.cursor = 'auto'
	if (rectangleMouseDown.click) {
		// window.clearTimeout(timerStarter);
		// timerStarter = null;

		event.stopPropagation();
		$("image").off("mousemove", rectangleMouseMove);
		$("image").off("mouseup", rectangleMouseUp);
		$("rect").attr("pointer-events", "all");
		// $(event.target).off("mouseup", rectangleMouseUp);
		// $("rect").on("mousedown", rectangleMouseDown);
		rectangleClicked(rectangleMouseDown.event);

		event.handled = true;
		rectangleMouseDown.click = null;
		return;
	}

	event.stopPropagation();
	$("image").off("mousemove", rectangleMouseMove);
	$("image").off("mouseup", rectangleMouseUp);
	// $(event.target).off("mouseup", rectangleMouseUp);
	$(rectangleMouseDown.current).on("mousedown", rectangleMouseDown);
	$("rect").attr("pointer-events", "all");
	// window.clearTimeout(timerStarter);
	trackChanges.changed();
	changesLog.moveBox(rectangleMouseDown.current,
			boxes[rectangleMouseDown.current].xmin,
			boxes[rectangleMouseDown.current].ymin);
	// timerStarter = null;
	rectangleMouseDown.click = null;
	$("#"+rectangleMouseDown.current).attr("stroke", rectangleMouseDown.color);
	event.handled = true;

	// unSelect();
	// }
}

function imageOver(event) {
	$("#tooltip").css("display", "none");
}

function rectangleOver(event) {
	if (!clickFlag && editFlag) {
		resizeRectangle(event);
		return;
	}

	if (!selectFlag) {

		var id = $(event.target).attr("id");
//		var test = false;
	//	var tempName = dictOrdered[boxes[a].symbol];
//		if (typeof tempName == "undefined")
	//		tempName = "N/A";

//		for(var i =0; i< dictOrdered.length; i++) TODO
//			{
	//			if(typeof tempName != "undefined" )
		//			{
	//				$("#nameArea").text(tempName);
			//		test = true;
				//	}
			//	else
					//{
				//	tempName = "N/A"
					//}
//			}
//		if(!test)
//			$("#nameArea").text("N/A");

		document.getElementById("nameArea").innerHTML = boxes[id].unicodeName;

		$("#number").text(boxes[id].symbol);
		document.getElementById("tooltip").innerHTML = boxes[id].symbol+"<br />("+boxes[id].unicodeName+")";
		$("#tooltip").css("display", "block");
		$("#tooltip").css("top", boxes[id].ymax * zoom / 100 + y);
		$("#tooltip").css("left",
				(+boxes[id].xmin / 2 + boxes[id].xmax / 2) * zoom / 100 + x);

		// setThumbnail(event);
	}

	if (train) {
		var conf = boxes[$(event.target).attr("id")].confidence;
		conf = Math.floor(conf * 100);
		$("#signConfidence").text(conf + "\%");
	}

}
function xmlProcess(xmlData) {
	// This function goes through the whole annotation and-or results
	// and creates the results
	// it is assumed that the file is xml

	// extract all of the signs
	if(xmlData === "")
		return;

	var $signs = $(xmlData).find('object');

	$signs.each(function() {
		var box = new boundingBox();
		box.xmlBox($(this));
		if( (box.xmax-box.xmin > 10) && (box.ymax-box.ymin > 10))  // ignore too small or corrupted boxes!
		{
			box.svgBox();
			boxes.push(box);
		}
	});

	// $("rect").on("click",rectangleClicked);
	$("rect").on("mousedown", rectangleMouseDown);
	$("rect").on("mouseover", rectangleOver);
	$("rect").attr("pointer-events", "all");

}

function processCSVLines(csvData){

	if( csvData === "")
		return;

	var csv_lines = csvData.split('\n');

	var data = csv_lines[0].split(',');
	var current_line = data[0];
	var line_obj = new line(parseFloat(data[1]), parseFloat(data[2]), 0);
	lines.push(line_obj);

	for(var i = 1, n = csv_lines.length; i < n; i++)
		{
			data = csv_lines[i].split(',');

			if(data[0] !== current_line)
				{
					current_line = data[0];
					line_obj.clearLast(); // line always adds a last, movable segment, it has to be erased
					line_obj = new line(parseFloat(data[1]), parseFloat(data[2]), lines.length-1);
					lines.push(line_obj);
				}
			else
				{
					line_obj.x = parseFloat(data[1]);
					line_obj.y = parseFloat(data[2]);
					line_obj.addSegment();
				}
		}

	line_obj.clearLast(); // line always adds a last, movable segment, it has to be erased

}
function reactKeyboard(event) {
	this.popUp;
	this.popUpName;
	// If popUp:

	if (visible) {
		if (event.which == _ESC_) // ESC: close Popup.
		{
			oldDetectionsWindow.hide();
			setPopUp();
			return;
		}
		if (event.which == _ENTER_) // ENTER: store data
		{
			if (noEdit) {
				event.preventDefault();
				return;
			}
			event.preventDefault();
			if(dictUpdateOpen) // update dictionary
			{
				dictionaryUpdate();
			}else				// save annotation
				storeSignInfo();

			return;
		}
		return;
	}

	// check for shurtcuts
	if(event.ctrlKey && event.shiftKey)
	{
		switch (event.which) {
		case _A_:
			annotate();
			return;
		case _E_:
			defaultMode();
			return;
		}
	}
    if(event.ctrlKey && event.shiftKey && event.which == _COMMA_) {
        switchAlpha();
    }

	if (this.popUp == true) {
		document.getElementById(this.popUpName).style.display = 'none';
		this.popUp = false;
		return;
	}

	// h -> help
	if (event.which == _H_) {
		document.getElementById("popUp").style.display = 'block';
		this.popUp = true;
		this.popUpName = "popUp";
		return;
	}

	if (event.which == _H_) {
		document.getElementById("popUp").style.display = 'block';
		this.popUp = true;
		this.popUpName = "popUp";
		return;
	}

	// If a rectangle is selected
	if (selectFlag) {
		if (!editName) {
			switch (event.which) {
			case _DEL_: // DEL
				if (noEdit) {
					return;
				}
				var rectangle = document.getElementById(activeRectangle);
				rectangle.parentNode.removeChild(rectangle);
				boxes[activeRectangle] = null;
				changesLog.deleteBox(activeRectangle);
				activeRectangle = null;
				trackChanges.changed();

				break;
			case _ESC_: // ESC
				break;
			case _E_: // e (edit)
				if (noEdit) {
					return;
				}
				document.getElementById(activeRectangle).setAttribute("stroke",
						"orange");
				document.getElementById(activeRectangle).addEventListener(
						"click", imageClicked);
				svgElement.addEventListener("mousemove", resizeRectangle);
				setResize();
				document.body.style.cursor = 'nwse-resize';
				reactKeyboard.selected = true;
				clickFlag = !clickFlag;
				return;
			case _ENTER_: // ENTER ****************************************
				if (!noEdit) {
					event.preventDefault();
					editSignPopup(document.getElementById(activeRectangle),
							boxes[activeRectangle]);
				}
				else
					if(noEdit)
					{
						event.preventDefault();
						document.getElementById("numberEdit").readonly = true;
						document.getElementById("okButtonSave").style.display = 'none';
						editSignPopup(document.getElementById(activeRectangle),
								boxes[activeRectangle]);
					}
				return;
			case _TAB_: // TAB
						// **************************************************
				event.preventDefault();
				var index = parseInt(activeRectangle) + 1;
				while ((index <= boxes.length) && boxes[index] == null) {
					index++;
				}
				if (index <= boxes.length && boxes[index] != null) {
					unSelect();
					selectFlag = !selectFlag;
					selectRectangle(index);
				}
				return;
			default:
				return;
			}
			unSelect();
			selectFlag = !selectFlag;
		}

	}

	// If a rectangle is being drawn
	if (clickFlag) {
		if (event.which == _ESC_) {
			if(draw_line)
				{
					clickFlag = !clickFlag;
					svgElement.removeEventListener("mousemove", moveLine);
					lines[lines.length-1].clearLast();
					if(lines[lines.length-1].segments.length == 0)
						lines.pop();
				}else
				{
					clearCurrentRectangle();
				}
		}
	}

	// if a LINE is selected
	if(lines[0] != 0)
	{
		switch (event.which) {
		case _DEL_: // DEL
			if (noEdit) {
				return;
			}
			lines[lines[0]].erase();
			lines[0] = 0;
			break;
		case _ESC_: // ESC
			unSelect();
			break;
		}

	}
	// General short-cuts
	switch (event.which) {
	case _N_: // N - New Bounding Box Mode.
		// changeMode();
		break;
	}

	// Meta-Data
	if(!clickFlag && !selectFlag)
		{
			if(event.which == _ADD_)   //|| event.which == _ADD2_
 				{
				setPopUp("metaData");
				}
			if(event.which == _HASH_)
				{
					if(detectionInfo.detectedSigns.size > 0)
						document.getElementById("searchedOptions").style.display = "block";
					else
						document.getElementById("searchedOptions").style.display = "none";
					setPopUp("searchedTools");
				}
			if(event.which == _MULT_ || event.which == _DOT_) 
                (event.ctrlKey) ? showLabels(true): showLabels(false);
		}

	if(event.which == _L_){
		// LINE MODE!
		switchModes();

	}
}

function switchAlpha() {
	boxes.forEach(function(element, index, array) {
		if (element != null) {
			var opacity = element.svg.getAttribute("stroke-opacity");
            opacity = (opacity == opacityValue) ? 1 : opacityValue;
			element.svg.setAttribute("stroke-opacity", opacity);
		}
	});
}
function switchModes()
{
	if(train)
		return;

	unSelect();
	if(mode == "boxes")  // change to line
		{
			clickFlag = false;
			document.getElementById("mode").innerHTML = "<b>Line</b> Mode";
			document.getElementById("statusDefault").innerHTML = "Edit Lines";
			document.getElementById("statusAnnotate").innerHTML = "New Lines";
			document.getElementById("boxes_group").style.display = "none";
			document.getElementById("lines_group").style.display = "";
			mode = "lines";
			if(editFlag)
				draw_line = true;
		}
	else
		{
			document.getElementById("boxes_group").style.display = "";
			document.getElementById("lines_group").style.display = "none";
			document.getElementById("mode").innerHTML = "<b>Box</b> Mode";
			document.getElementById("statusDefault").innerHTML = "Edit Boxes";
			document.getElementById("statusAnnotate").innerHTML = "New Boxes";
			if(draw_line)
			{
				draw_line = false;
				if(clickFlag)
				{ // stop drawing if doing so
					clickFlag = false;
					svgElement.removeEventListener("mousemove", moveLine);
					lines[lines.length-1].clearLast();
				}

			}
			else
			{
				clickFlag = false;
				draw_line = false;
				//document.getElementById("mode").innerHTML = "<b>Line</b> Mode";
			}
			mode = "boxes";
		}
    updateTotalBoxes();
	}
function unSelect() {
	if(lines[0] != 0)
		lines[lines[0]].deselect();

	var $sameSymbol = $("[name='" + rectangleClicked.symbol + "']");
	setPopUp();
	if((typeof activeRectangle != 'undefined') && activeRectangle != null)
		document.getElementById(activeRectangle).setAttribute("stroke-width", 1);

	if (resizeMode) {
		document.getElementById("infoEdit").style.display = "none";
		document.getElementById("infoDefault").style.display = "block";
	}
    unselectSignClass();

	selectFlag = false;
	activeRectangle = null;
}

function confidenceUpdate(threshold) {
	var visible = 0;

	boxes.forEach(function(element, index, array) {
		if (element != null) {
			if (element.confidence < threshold) {
				document.getElementById(element.id).setAttribute("display",
						"none");
				element.show = 0;
			} else {
				document.getElementById(element.id).setAttribute("display",
						"true");
				element.show = 1;
				visible++;
			}
		}
	});
	var totalBoxes = boxes.length-1;
	document.getElementById("totals").innerHTML = "Boxes: "+visible+" / "+totalBoxes;
	// update slider value
    document.getElementById("slider").value=threshold;
    // update text below slider
	$("#sliderPosition").text(threshold);
	if(train)
		maximumSuppression(parseFloat(document.getElementById("nonmax").value));  //slider
}

function colorizeConfidence() {
	boxes.forEach(function(element, index, array) {
		if (element != null) {
			var hue = Math.round(element.confidence * 100);
			document.getElementById(element.id).setAttribute("stroke",
					"hsla(" + hue + ",100%,50%,1)");
		}
	});
}

function colorizeNGram(direction) {

	switch(direction)
	{
	case "lr":
		boxes.forEach(function(element, index, array) {
			if (element != null) {
				var hue = Math.round(element.ngram * 100);
				document.getElementById(element.id).setAttribute("stroke",
						"hsla(" + hue + ",100%,50%,1)");
			}
		});
		break;
	case "rl":
		boxes.forEach(function(element, index, array) {
			if (element != null) {
				var hue = Math.round(element.prior * 100);
				document.getElementById(element.id).setAttribute("stroke",
						"hsla(" + hue + ",100%,50%,1)");
			}
		});
		break;
	default:
		boxes.forEach(function(element, index, array) {
			if (element != null) {
				var hue = Math.round(Math.max(element.ngram, element.prior) * 100);
				document.getElementById(element.id).setAttribute("stroke",
						"hsla(" + hue + ",100%,50%,1)");
			}
		});
	}
}

function colorizeCorrections() {

	boxes.forEach(function(element, index, array) {
		if (element != null) {
			if (element.reviewed) {
				if (!element.fp)
					document.getElementById(element.id).setAttribute("stroke",
							"lawngreen"); // Reviewed and not FP -> ok!
				else if (element.correction != "000")
					document.getElementById(element.id).setAttribute("stroke",
							"yellow"); // Reviewed, FP but still a sign
				else
					document.getElementById(element.id).setAttribute("stroke",
							"red"); // Not even a sign!
			} else
				document.getElementById(element.id).setAttribute("stroke",
						"blue");
		}
	});
}

function toggleLoadButtons() {
	if (annotationsLoaded) {
		document.getElementById("load").style.display = 'none';
		document.getElementById("lastResult").style.display = 'none';
	    document.getElementById("lastResultOld").style.display = "none";
		// document.getElementById("upload").style.display = 'none';
		document.getElementById("detect").style.display = 'none';
		document.getElementById("reload").style.display = 'block';
		document.getElementById("clear").style.display = 'block';
	//	document.getElementById("saveLocal").style.display = 'block';
		if (!train)
			document.getElementById("backup").style.display = 'block';
		$('.helpAnnotate').css("display", "block");
		$('.editpossible').css("display", "block");
		$('.helpTraining').css("display", "none");
		$('.helpStart').css("display", "none");
		if(offline)
			return;
		if(statusAnnotations == "done")
			$('.editpossible').css("display", "none");

	} else {
		document.getElementById("load").style.display = 'block';
		document.getElementById("lastResult").style.display = 'block';
	    document.getElementById("lastResultOld").style.display = "none";
		// document.getElementById("upload").style.display = 'block';
		document.getElementById("detect").style.display = 'block';
		document.getElementById("reload").style.display = 'none';
		document.getElementById("clear").style.display = 'none';
		document.getElementById("slider").style.display = "none";
		document.getElementById("confidenceArea").style.display = "none";
		document.getElementById("sliderPosition").style.display = "none";
		document.getElementById("backup").style.display = 'none';
	//	document.getElementById("saveLocal").style.display = 'none';
		$('.helpAnnotate').css("display", "none");
		$('.editpossible').css("display", "none");
		$('.helpTraining').css("display", "none");
		$('.helpStart').css("display", "block");
	}
}

function saveAnnotationsServer(saveMode, bCorrection=false) {


	if (saveMode=='archive')
		{
		// check for unnamed boxes!
		boxes.forEach(function(element, index, array) {
			if(element !=null && element.symbol == "000")
				window.alert("There are unlabeled boxes, archiving not possible!");
			});

		if(!trackChanges.prompt("Are you sure you want to archive this annotation?\nOnce archived, an annotation con not be edited and is free to be used for training!"))
			return;
		else
			{
			document.getElementById("backupSelect").style.display ='none';
			//document.getElementById("archiveServer").style.display ='none';
			statusAnnotations = 'done';
			noEditMode();
			}
		}
	else
		{
		if($('#saveServer').hasClass("disabled") && !$("#statusCorrect").hasClass("statusSelected"))
		{
			console.log('Saving not allowed');
			return;
		}
		}


	var newXML = generateXML(bCorrection);
	var XMLS = new XMLSerializer();
	var uploadData = {};

	if(boxes.length >1)
	{
		uploadData.xml = XMLS.serializeToString(newXML);
	}
	else
		uploadData.xml = "";

	uploadData.saveMode = saveMode;

	if(lines.length > 1)
		{
		var csv = Array();
		lines.forEach(function(element, index, array){

			if(element instanceof line)
				csv.push(element.getCSV());
		});
		uploadData.lines = csv.join('\n');
		}
	else
		uploadData.lines = "";

	//JSON.stringify(uploadData);
	$.ajax({
/*		type : "GET",
		url : "uploadannotation.php?annotationStatus=" + saveMode,
		dataType : "json",
		async : true,
		cache : false,
		error : function() {
			alert("No data found.");
		},
		success : function(array) {
			$.ajax({*/
				type : "POST",
				url : "uploadannotation.php",
				data : uploadData,
				//processData : false,
				//contentType : "application/json", // was xml
				cache : false,
				error : function() {
					alert("No data found.");
				},
				success : function() {
					trackChanges.saved();
					if (annotationsVersions > 0) {
						var sel = document.getElementById("backupSelect");
						var opt1 = document.createElement("option");
						opt1.value = annotationsVersions + 1;
						opt1.text = "Version " + annotationsVersions;
						sel.add(opt1, sel.options[1]);
					}
					annotationsVersions = annotationsVersions + 1;
					statusAnnotations = "partial";
					var JSONdata = changesLog.flushLog();
					$.ajax({
						type : "POST",
						url : "logChanges.php",
						data : JSONdata,
						processData : false,
						contentType : "application/json",
						cache : false,
						error : function(jqXHR, textStatus, errorThrown) {
							alert(errorThrown);
						},
						success : function() {

						}
					});

				}
			});
		/*}
	});*/
}

function possibleAutoAnnote()
{
	if(statusAnnotations == "none")
		setPopUp('generateAnno');
	else
		sendCorrections(false);
}
function sendCorrections(newAnno) {
	// Check if all corrected and select the correct ones
	var threshold = document.getElementById("slider").value; // TODO
	var positives = [];
	var falsePositives = []; //
	var notAllReviewed = false;
	var goOn = true;
	var signsList = []; // to tell php which signs are to be saved
	var totalDetections = 0;
	var threshDetections = 0;

	boxes.forEach(function(element, index, array) {
		if (element != null)
			{
				totalDetections += 1;
				if( element.confidence >= threshold)
					// element
																		// exists and is
																		// bigger than
																		// threshhold
				{
					totalDetections += 1;
					if (!element.reviewed)
						notAllReviewed = true;
					else if (element.fp)
						{
						threshDetections += 1;
						falsePositives.push(element.boxCorrections());
						if(signsList.indexOf(element.symbol) == -1)   // check if the name was already stored
							signsList.push(element.symbol);
						}
					else
						{
						positives.push(element.boxCorrections());
						threshDetections += 1;
						}
				}
			}
		});

	// If not, prompt
	if (notAllReviewed)
		goOn = window
				.confirm("You haven't reviewed all the detections.\nAre you sure you want to send the corrections?\nCurrent detection data will be lost!!\n(Think about saving the corrections and finishing your feedback later!)");

	// if it's a go: Sort the
	var data = {};
	data = {
			'detectionID': detectionInfo.ID,
			'fpList': signsList,
			'positives' : positives,
			'fp' : falsePositives,
			'threshold': threshold,
			'totalDetections': totalDetections,
			'threshDetections': threshDetections,
			'fullFeedback': JSON.stringify(boxes) ,
			'newAnnotation': newAnno
			};
	JSON.stringify(data);
	if (goOn)
		$.ajax({
			type : "POST",
			url : "storeCorrections.php",
			data : data,
			cache : false,
			error : function() {
				console.log("Error sending corrections!");
				window.alert("An error ocurred");
				return;
			},
			success : function(result) {
				document.getElementById("saveCorrections").style.display = "none";
				document.getElementById("sendCorrections").style.display = "none";
				document.getElementById("reTrain").style.display = "block";
				if(statusAnnotations == 'none')
					{
					statusAnnotations = 'partial';
					window.alert("An annotation for this image has been generated from the positive feedback");
					}
			}
		});
}

function clearAnnotations() {
	var rectangle;

	if (!trackChanges.prompt("Are you sure you want to clear the annotations?"))
		return;

	annotationsLoaded = false;

/*	boxes.forEach(function(element, index, array) {
		if (element != null) {
			rectangle = document.getElementById(element.id);
			rectangle.parentNode.removeChild(rectangle);
		}
	});*/

	// get all the obects in teh svg
	var SVG = document.getElementById("boxes_group").children;

	// loop over all the rectangles and erase them!
	// We have to start at the _end_ or the indexing will be lost!
	for(var i = SVG.length-1; i>=0; i--)
		{
			SVG[i].parentNode.removeChild(SVG[i]);
		}

	var SVG = document.getElementById("lines_group").children;

	// loop over all the lines and erase them!
	// We have to start at the _end_ or the indexing will be lost!
	for(var i = SVG.length-1; i>=0; i--)
		{
			SVG[i].parentNode.removeChild(SVG[i]);
		}

	boxes = [ null ];
	lines = [ 0 ];
	toggleLoadButtons();
	document.getElementById("statusfeld").style.display = "block";
	document.getElementById("infoDetect").style.display = "none";
	if (train) {
		train = false;
		$("#clear").text("Clear Annotations");
		$("#mode").text("Box Mode");
		document.getElementById("infoDetect").style.display = "none";
		document.getElementById("backup").style.display = "none";
		document.getElementById("infoTrain").style.display = "none";
		document.getElementById("statusAnnotate").style.display = 'block';
		//document.getElementById("statusEdit").style.display = 'block';
		document.getElementById("statusDefault").style.display = 'block';
		document.getElementById("statusCorrect").style.display = 'none';
		document.getElementById("buffer1").style.display = 'none';
		document.getElementById("buffer2").style.display = 'none';
		document.getElementById("sendCorrections").style.display = "none";
		document.getElementById("reTrain").style.display = "none";
		document.getElementById("trainCheckboxes").style.display = "none";
		document.getElementById("HOGandModel").style.display = "none";

	}
	changesLog.clearLog();
	trackChanges.clear();
	//document.getElementById("loadLocal").style.display = 'block';
	if(offline)
		{
			defaultMode();
		}
	if (statusAnnotations == "done") {
		noEditMode();
	}
	else
		defaultMode();

	activeRectangle = null;
	document.getElementById("totals").innerHTML = "Boxes: 0";
}

function reloadAnnotations(version) {
	clearAnnotations();
	loadAnnotations(version);
	updateTotalBoxes();
}

function editSignPopup(svgRectangle, boundingBox) {
	xSVG = boundingBox.xmax * zoom / 100 + 50;
	ySVG = boundingBox.ymax * zoom / 100 + 50;
	document.getElementById("signEdit").style.left = xSVG;
	document.getElementById("signEdit").style.top = ySVG;
	document.getElementById("numberEdit").value = boundingBox.symbol;
	if(boundingBox.readableSymbol != "N/A")
	{
		document.getElementById("editHumanReadable").innerHTML = boundingBox.unicodeName + " ("+boundingBox.symbol+")";
	}else
		document.getElementById("editHumanReadable").innerHTML = "No dictionary entry";

	document.getElementById("editWarning").style.display = "none";

	if (train) {
		// document.getElementById("model").src = "images/models/e2-thumb.jpg";
		if(!noEdit)
			document.getElementById("trainCheckboxes").style.display = "block";
		else
			document.getElementById("trainCheckboxes").style.display = "none";

	//	document.getElementById('model').setAttribute('xlink:href',	resultsDirectory + boundingBox.thumbName);
	//	document.getElementById('hog').setAttribute('xlink:href',	resultsDirectory + boundingBox.HOGName);

//		var svgmodel = document.getElementById("svgModel");
//		svgmodel.setAttribute("width", boundingBox.thumbWidth);
//
//		svgmodel.setAttribute("height", boundingBox.thumbHeight);
//
//		var model = document.getElementById("model");
//		model.setAttribute("x", -boundingBox.thumbXStart);
//		var svgHOG = document.getElementById("svgHOG");
//		svgHOG.setAttribute("width", boundingBox.thumbWidth);
//
//		svgHOG.setAttribute("height", boundingBox.thumbHeight);
//
//		var HOG = document.getElementById("hog");
//		HOG.setAttribute("x", -boundingBox.thumbHOG);
		document.getElementById("wrongSign").checked = false;
		document.getElementById("noSign").checked = false;
		document.getElementById("numberEdit").readOnly = true; // the number
																// field will
																// only be
																// editable
																// after
																// clicking on
																// the richt
																// checkbox (to
																// avoid
																// mistakes)
		var roundScore = Math.round(boundingBox.confidence*100)/100;
		document.getElementById("showConfidence").innerHTML = roundScore;
	}
	var svgthumb = document.getElementById("svgThumb");
	var scaling = 100/svgRectangle.getAttribute("height");
	svgthumb.setAttribute("width", svgRectangle.getAttribute("width") * scaling);
	svgthumb.setAttribute("height", svgRectangle.getAttribute("height") * scaling);
	svgthumb.setAttribute("viewBox", [boundingBox.xmin, boundingBox.ymin, svgRectangle.getAttribute("width"), svgRectangle.getAttribute("height")])
	// svgthumb.setAttribute("transform", "scale(" + scaling + ")");

	// Select the correct radio button
	document.querySelector(`#SignConservationState input[value="${boundingBox.status}"]`).checked = true;

	setPopUp("signEdit");
	document.getElementById("numberEdit").focus();
	document.getElementById("numberEdit").select();

	// Place the big nasty thumbnail correctly.
	//var thumb = document.getElementById("thumb");
	//thumb.setAttribute("x", -boundingBox.xmin);
	//thumb.setAttribute("y", -boundingBox.ymin);


}

function storeSignInfo() {
	var editElement = document.getElementById("numberEdit");
	var newName = editElement.value;
	var warning = document.getElementById("editWarning");
	var rectangle = document.getElementById(activeRectangle);

	// Re-doing this for text-based annotations!
	// TODO
	// Check for alphanumeric, skip if 000!
	// this checks if newName is in dictionary and returns:
	// newName.newName = input; // original name "N/A" if original input numeric AND no entry in dictionary NAME if exists in DIctionary
	// newName.label   = "000"; // new numeric label
	// newName.numeric = false; // was the original numeric?
	// newName.newEntry = false; // did the original need a new Entry in the dictionary?

	newName = parseInput(newName);

	if (!train) { // Normal annotating mode
		if (newName != null) { // correct input!

			if(newName.newEntry)
				return;  // this is a new entry, so wait for more input!

			// First, new numeric label
			// Numeric value will only change if different from actual value and non-zero
			if (newName.label != boxes[activeRectangle].symbol && newName.label != 0) {
			//	newNameID = ("000" + (newNameID)).slice(newNameID.length); done by parser
				boxes[activeRectangle].symbol = newName.label;

				rectangle.setAttribute("name", newName.label);
				rectangle.setAttribute("stroke", defaultColor);
				changesLog.newLabel(activeRectangle, newName.label);
				trackChanges.changed();
			}
			if(newName.newName != boxes[activeRectangle].readableSymbol) // different HR name (could just be a synonim!)
			{
				boxes[activeRectangle].readableSymbol = newName.newName;
				boxes[activeRectangle].unicodeName = unicodize(newName.newName);
				trackChanges.changed();
			}

			if(newName.label == nextLabel)
				{
					var temp = parseInt(nextLabel);
					if(temp != usedLabels.length)
					{
						usedLabels[temp] = 1;
						for (var i = temp; i<usedLabels.length; i++)
							{
								if( typeof usedLabels[i] == "undefined")
									{
										nextLabel = ("000"+i).slice(-3);
										break;
									}
							}
					}else
						{
							nextLabel = ("000"+(temp+1)).slice(-3);
							usedLabels[temp] = 1;
						}

				}
			warning.style.display = "none";
			// Now check the conservation state
			if(boxes[activeRectangle].status != getConservationState()) {
				boxes[activeRectangle].status = getConservationState();
				trackChanges.changed();
			}
            rectangle.classList.remove("intact");
            rectangle.classList.remove("broken");
            rectangle.classList.remove("partial");
            rectangle.classList.add(getConservationState());
			setPopUp();
			unSelect();
			return;
		} else {
			editElement.value = "";
			warning.innerHTML = "Not a valid label!";
			warning.style.display = "block";

			return;
		}
	} else { // Trainign mode, saving corrections
		if (document.getElementById("noSign").checked) // Not a sign!
		{
			boxes[activeRectangle].fp = true;
			boxes[activeRectangle].reviewed = true;
			boxes[activeRectangle].correction = "000";
			boxes[activeRectangle].corRead = "";
			rectangle.setAttribute("name", "000");
			rectangle.setAttribute("stroke", "red");
		}
		if (document.getElementById("wrongSign").checked) {
			if (newName != null && !newName.newEntry) // Only if this not a new entry
			{
				if (newName.label != boxes[activeRectangle].symbol) { //accept the changes _only_ if a new number typed!
					boxes[activeRectangle].fp = true;
					boxes[activeRectangle].reviewed = true;
					boxes[activeRectangle].corRead = unicodize(newName.newName);
					rectangle.setAttribute("stroke", "yellow");
					boxes[activeRectangle].correction = newName.label;
                    boxes[activeRectangle].wrongLabel = boxes[activeRectangle].symbol;
                    boxes[activeRectangle].symbol = newName.label;
                    boxes[activeRectangle].unicodeName = boxes[activeRectangle].corRead;
                    rectangle.setAttribute("name", newName.label);  
                    boxes[activeRectangle].readableSymbol = newName.newName;
				} else {
					editElement.value = boxes[activeRectangle].symbol;
					warning.innerHTML = "Please type a correction.";
					warning.style.display = "block";
					return;

				}
			} else {
				if(!newName.newEntry) // if newEntry, no error mesage
				{
					editElement.value = boxes[activeRectangle].symbol;
					warning.innerHTML = "Not a valid Label!";
					warning.style.display = "block";
				}
				return;
			}
		}
		if (!boxes[activeRectangle].fp) // no corrections made > correct sign!
		{
			boxes[activeRectangle].reviewed = true;
			rectangle.setAttribute("stroke", "lawngreen");
		}
		boxes[activeRectangle].status = getConservationState();
rectangle.classList.remove("intact");
            rectangle.classList.remove("broken");
            rectangle.classList.remove("partial");
            rectangle.classList.add(getConservationState());
		setPopUp();
		unSelect();
		// now move the svg Box to the back!
		var parent = document.getElementById("boxes_group");
		// remove the rectangle first
		parent.removeChild(rectangle);
		// insert it at the beginning
		parent.insertBefore(rectangle, parent.children[1]);

		return;
	}
	editElement.value = "";

}

function getConservationState() {
	return document.querySelector('input[name="conservation"]:checked').value;
}

function acceptAllCorrections() {
    
    for(var i = 1; i < boxes.length; i++) {
            if(boxes[i].show == 1) {
			    boxes[i].reviewed = true;
			    boxes[i].svg.setAttribute("stroke", "lawngreen");
            }
    }
}
function toggleTrainCheckBoxes(checkBox) {
	if (checkBox.id == "wrongSign") {
		if (checkBox.checked) // it was checked -> enable textfield!
		{
			document.getElementById("numberEdit").readOnly = false;
			document.getElementById("numberEdit").focus();
		} else
			document.getElementById("numberEdit").readOnly = true;

		if (document.getElementById("noSign").checked)
			document.getElementById("noSign").checked = false;

	} else // it"s the other cb!
	{
		if (checkBox.checked) {
			document.getElementById("numberEdit").readOnly = true; // not even
																	// a sign,
																	// no need
																	// to write
																	// anything
			document.getElementById("wrongSign").checked = false;
		}

	}
}

function setPopUp(name) {
	this.visible;
	this.active;

	if (typeof name != 'undefined') {
		// check if one is already assigned!
		if (this.active != null)
			setPopUp();

		this.active = name;
		this.visible = true;
		document.getElementById(name).style.display = "block";
	} else {
		if (typeof active != 'undefined')
			if (active != null) {
				this.visible = false;
				document.getElementById(active).style.display = "none";
				this.active = null;
				if (editName)
					unSelect();
			}

	}
	if (typeof visible == 'undefined')
		visible = false;
}

function clearCurrentRectangle() {
	if (clickFlag) // if true, a box is being drawn
	{
		var svgRectangle = document.getElementById(activeRectangle);
		svgElement.removeEventListener("mousemove", resizeRectangle);
		svgRectangle.removeEventListener("click", imageClicked);
		svgRectangle.parentNode.removeChild(svgRectangle);
		if (!(reactKeyboard.selected)) // an existing rectangle wasn't being
										// drawn!!
		{

			boxes[activeRectangle] = null;

		} else {
			boxes[activeRectangle].svgBox();
		}
		clickFlag = !clickFlag;
	}
	// IMPORTANT: do not revert to incorrect mode!!!
	if (resizeMode)
		setMove();
	activeRectangle = null;
}

function changesTracker() {
	edited = false;
	mayArchivate = false;

}

changesTracker.prototype.changed = function() {
	if (this.mayArchivate) {
		document.getElementById("saveServer").style.display = "block";
		//document.getElementById("archiveServer").style.display = "none";
		this.mayArchivate = false;
	}
	if (!this.edited) {
		$("#statusSave").text("Not Saved");
		this.edited = true;
		$("#statusSave").toggleClass("statusAttention");
		$("#saveServer").removeClass("disabled");
	}
	if(!train) {
		updateTotalBoxes();
	}
};
changesTracker.prototype.clear = function() {
	$("#statusSave").text("Saved");
	$("#statusSave").removeClass("statusAttention");
	document.getElementById("saveServer").style.display = "block";
	//document.getElementById("archiveServer").style.display = "none";
	this.edited = false;
	this.mayArchivate = false;
	$("#saveServer").addClass("disabled");
};

changesTracker.prototype.saved = function() {
	if (this.edited) {
		$("#statusSave").text("Saved");
		$("#statusSave").toggleClass("statusAttention");
		//document.getElementById("saveServer").style.display = "none";
		//if(statusAnnotations != "done")
			//document.getElementById("archiveServer").style.display = "block";
		this.edited = false;
		this.mayArchivate = true;
		$("#saveServer").addClass("disabled");
	}

};

changesTracker.prototype.prompt = function(message) {
	if (this.edited || this.mayArchivate)
		return window.confirm(message);
	else
		return true;

};

function clearMode() {
	$('#statusAnnotate').removeClass('statusSelected');
	$('#statusEdit').removeClass('statusSelected');
	$('#statusDefault').removeClass('statusSelected');
	$('#statusProtected').removeClass('statusSelected');
	$('#statusCorrect').removeClass('statusSelected');
	if(clickFlag && draw_line)
	{ // stop drawing if doing so
		clickFlag = !clickFlag;
		svgElement.removeEventListener("mousemove", moveLine);
		lines[lines.length-1].clearLast();
	}

	setPopUp();
	clearCurrentRectangle();
	unSelect();
	editName = false;
	editFlag = false;
	clickFlag = false;
	selectFlag = false;
	noEdit = false;
	reactKeyboard.selected = false;
	resizeMode = false;
	draw_line = false;
	document.getElementById("infoNewBoxes").style.display = "none";
	document.getElementById("infoRelabel").style.display = "none";
	document.getElementById("infoDefault").style.display = "none";
	document.getElementById("infoProtected").style.display = "none";
	document.getElementById("infoEdit").style.display = "none";
	document.getElementById("numberEdit").readonly = false;
	document.getElementById("okButtonSave").style.display = 'inline-block';
	document.getElementById("sendCorrections").style.display = "none";
	document.getElementById("saveCorrections").style.display = "none";
	document.getElementById("loadBackup").style.display = "none";
	document.getElementById("cleanUp").style.display = "none";
    document.getElementById("acceptAll").style.display = "none";
	document.getElementById("generalHelp").style.display = "block";
	document.getElementById("trainHelp").style.display = "none";
	//document.getElementById("totals").style.display = "none";
	document.getElementById("image").style.cursor = "auto";
	document.getElementById("nonMaxBox").style.display = "none";
	document.getElementById("lastResult").style.display = "block";
	document.getElementById("lastResultOld").style.display = "block";
	updateTotalBoxes();
//	if(annotationsLoaded)
		//document.getElementById("saveLocal").style.display = "block";
//	else
		//document.getElementById("saveLocal").style.display = "none";
}

function setTraining()
{
	annotationsLoaded = !annotationsLoaded;
	train = true;
	$("#clear").text("Quit Training"); // TODO better own button.
	document.getElementById("confidenceArea").style.display = "block";
	document.getElementById("slider").style.display = "block";
	document.getElementById("sliderPosition").style.display = "block";
	document.getElementById("statusfeld").style.display = "none";
	document.getElementById("infoDetect").style.display = "block";
	document.getElementById("backup").style.display = "none";
	$("#mode").text("Train Mode");
	$('.helpAnnotate').css("display", "none");
	$('.editpossible').css("display", "none");
	$('.helpTraining').css("display", "block");
	$('.helpStart').css("display", "none");
	trainMode();
	trackChanges.saved();

}
function trainMode() {
	train = true;
	// relabel();
	noEditMode();
	toggleLoadButtons();
	document.getElementById("backup").style.display = 'none';
	document.getElementById("infoTrain").style.display = "block";
	document.getElementById("statusAnnotate").style.display = 'none';
	//document.getElementById("statusEdit").style.display = 'none';
	document.getElementById("statusDefault").style.display = 'none';
	document.getElementById("statusCorrect").style.display = 'block';
	document.getElementById("buffer1").style.display = 'block';
	document.getElementById("buffer2").style.display = 'block';
	document.getElementById("saveServer").style.display = 'none';
	//document.getElementById("loadLocal").style.display = 'none';
	document.getElementById("generalHelp").style.display = "none";
	document.getElementById("trainHelp").style.display = "block";
	//document.getElementById("saveLocal").style.display = "none";
	document.getElementById("HOGandModel").style.display = "block";
	//document.getElementById("totals").style.display = "block";
	document.getElementById("cleanUp").style.display = "block";
	document.getElementById("nonMaxBox").style.display = "block";
	$('.helpAnnotate').css("display", "none");
	$('.editpossible').css("display", "none");
	$('.helpTraining').css("display", "block");
	confidenceUpdate(0.3); // This will initialize the confidence tracker.
	document.getElementById("slider").value=0.3;
}
function annotate() {
	clearMode();
	$('#statusAnnotate').addClass('statusSelected');
	annotationsLoaded = true;
	toggleLoadButtons();
	document.getElementById("image").style.cursor = "crosshair"
	setResize();
	if (!train)
		{
		document.getElementById("infoNewBoxes").style.display = "block";
	//	document.getElementById("saveLocal").style.display = "block";
		}
}

function correctMode() {
	clearMode();
	$('#statusCorrect').addClass('statusSelected');
	editName = true;
	setStatic();
	document.getElementById("infoDetect").style.display = "none";
	document.getElementById("infoCorrect").style.display = "block";
	document.getElementById("reTrain").style.display = "none";
	document.getElementById("saveServer").style.display = "none";
	document.getElementById("reload").style.display = "none";
	document.getElementById("sendCorrections").style.display = "block";
	document.getElementById("saveCorrections").style.display = "block";
	document.getElementById("generalHelp").style.display = "none";
	document.getElementById("lastResult").style.display = "none";
	document.getElementById("lastResultOld").style.display = "none";
	document.getElementById("trainHelp").style.display = "block";
	document.getElementById("infoTrain").style.display = "none";
	document.getElementById("infoFeedback").style.display = "block";
    document.getElementById("acceptAll").style.display = "block";
	// @TD
	document.getElementById("cleanUp").style.display = "block";
	document.getElementById("nonMaxBox").style.display = "block";
	$('.helpAnnotate').css("display", "none");
	$('.helpTraining').css("display", "block");
	$('.editpossible').css("display", "none");
	colorizeCorrections();
}
function relabel() {
	clearMode();
	$('#statusEdit').addClass('statusSelected');
	editName = true;
	setStatic();
	toggleLoadButtons();
	if (!train)
		document.getElementById("infoRelabel").style.display = "block";
	if(!annotationsLoaded && backupAvailable)
		document.getElementById("loadBackup").style.display = "block";
}

function defaultMode() {
	clearMode();
	resizeMode = true;
	$('#statusDefault').addClass('statusSelected');
	setMove();
	if (!train)
		document.getElementById("infoDefault").style.display = "block";
	if(!annotationsLoaded && backupAvailable)
		document.getElementById("loadBackup").style.display = "block";
}

function noEditMode() {
	clearMode();
	$('#statusProtected').addClass('statusSelected');
	$("rect").on("mouseover", rectangleOver);
	noEdit = true;
	setStatic();
	if (!train)
		document.getElementById("infoProtected").style.display = "block";
	else
		{
		document.getElementById("infoTrain").style.display = "block";
		document.getElementById("infoFeedback").style.display = "none";
		// @TD
		document.getElementById("cleanUp").style.display = "block";
		document.getElementById("nonMaxBox").style.display = "block";
		}
	if(offline)
		return;
	if(statusAnnotations == "done")
		{
		document.getElementById("statusAnnotate").style.display = 'none';
		document.getElementById("statusEdit").style.display = 'none';
		document.getElementById("statusDefault").style.display = 'none';
		document.getElementById("buffer1").style.display = 'block';
		document.getElementById("buffer2").style.display = 'block';
		document.getElementById("saveServer").style.display = 'none';
		$('.editpossible').css("display", "none");
		}
	if(!annotationsLoaded && backupAvailable)
		document.getElementById("loadBackup").style.display = "block";
}

function setResize() {
	$("rect").off("click", rectangleClicked);
	$("rect").off("mousedown", rectangleMouseDown);
	$("rect").off("mouseover", rectangleOver);
	$("rect").off("mouseup", rectangleMouseUp);
	$("rect").attr("pointer-events", "none");
	editFlag = true;
	if(mode == "lines")
		draw_line = true;
}

function setMove() {
	$("rect").off("click", rectangleClicked);
	$("rect").off("mousedown", rectangleMouseDown);
	$("rect").off("mouseover", rectangleOver);
	$("rect").on("mousedown", rectangleMouseDown);
	$("rect").on("mouseover", rectangleOver);
	$("rect").attr("pointer-events", "all");
	editFlag = false;
}
function setStatic() {
	$("rect").off("click", rectangleClicked);
	$("rect").off("mouseover", rectangleOver);

	$("rect").on("click", rectangleClicked);
	$("rect").off("mousedown", rectangleMouseDown);
	$("rect").on("mouseover", rectangleOver);
	$("rect").attr("pointer-events", "all");
	editFlag = false;
	if (train) {
		document.getElementById("infoDetect").style.display = "block";
		document.getElementById("infoCorrect").style.display = "none";
		document.getElementById("sendCorrections").style.display = "none";
		document.getElementById("reTrain").style.display = "none";
		document.getElementById("generalHelp").style.display = "none";
		document.getElementById("trainHelp").style.display = "block";
		$('.helpAnnotate').css("display", "none");
		$('.editpossible').css("display", "none");
		$('.helpTraining').css("display", "block");
		colorizeConfidence();
	}
}

function changeLog() {
	this.changeArray = new Array();
	this.actualPosition = -1;

}

changeLog.prototype.newBox = function(id, label, xmin, xmax, ymin, ymax) {
	var myObj = new Object();

	myObj.action = "NEW";
	myObj.id = id;
	myObj.label = label;
	myObj.xmin = xmin;
	myObj.xmax = xmax;
	myObj.ymin = ymin;
	myObj.ymax = ymax;

	this.changeArray.push(myObj);
	this.actualPosition++;
	console.log('NEW: ' + id + ' label: ' + label);
};

changeLog.prototype.newLabel = function(id, label) {
	var myObj = new Object();

	myObj.action = "LABEL";
	myObj.id = id;
	myObj.label = label;

	this.changeArray.push(myObj);
	this.actualPosition++;
	console.log('RELABEL: ' + id + ' label: ' + this.label);
};

changeLog.prototype.resizeBox = function(id, xmax, ymax) {
	var myObj = new Object();

	myObj.action = "RESIZE";
	myObj.id = id;
	myObj.xmax = xmax;
	myObj.ymax = ymax;

	this.changeArray.push(myObj);
	this.actualPosition++;
	console.log('Resize: ' + id);
};

changeLog.prototype.deleteBox = function(id) {
	var myObj = new Object();

	myObj.action = "DEL";
	myObj.id = id;

	this.changeArray.push(myObj);
	this.actualPosition++;
	console.log('DELETE: ' + id + ' label: ' + this.label);
};

changeLog.prototype.moveBox = function(id, xmin, ymin) {
	var myObj = new Object();

	myObj.action = "MOVE";
	myObj.id = id;
	myObj.xmin = xmin;
	myObj.ymin = ymin;

	this.changeArray.push(myObj);
	this.actualPosition++;
	console.log('MOVE: ' + id + ' label: ' + this.label);
};

changeLog.prototype.flushLog = function() {
	var offset = this.changeArray.length - this.actualPosition;
	console.log(offset);
	var data;
	if (offset != 1)
		data == JSON.stringify(this.changeArray.slice(0, this.actualPosition));

	else
		data = JSON.stringify(this.changeArray);
	changeLog.prototype.clearLog.call(this);
	return data;

};

changeLog.prototype.clearLog = function() {
	this.changeArray = new Array();
	this.actualPosition = -1;
};

changeLog.prototype.undoLast = function() {
	// Later maybe
};

changeLog.prototype.redoLast = function() {
	// Later maybe
};

function showDetectAll() {
	$("#detectSingular").removeClass("statusSelected");
	$("#detectAll").addClass("statusSelected");
	document.getElementById("specificInput").style.display = "none";

}

function showDetectSpecific() {
	$("#detectAll").removeClass("statusSelected");
	$("#detectSingular").addClass("statusSelected");
	document.getElementById("specificInput").style.display = "block";
}

function showModelList() {

	var offsets = document.getElementById('popDetect').getBoundingClientRect();
	var left = offsets.left + offsets.width + 5;
	document.getElementById("modelList").style.left = left;
	var container = document.getElementById('availableModels');
	var pad = "000";
	document.getElementById("modelList").style.display = "block";

	// clear the container in case it was already called
	container.innerHTML = "";

	$.ajax({
		type : "GET",
		url : "matlabInfo.php?infoRequest=modelList",
		dataType : "json",
		success : function(result) {
			for ( var i in result ) {
				if (result.hasOwnProperty(i)) {
					if (result[i] == 1) {

						var model =(pad + (i)).slice(-pad.length);
						model = model + " ("+parseInput(model).newName+") ";
						container.innerHTML = container.innerHTML + model;
					}}}
					if (container.innerHTML == "")
						container.innerHTML = "No models available, please train.";

		},
		error : function(xhr, status, errorThrown) {
			console.log("Error: " + errorThrown);
			console.log("Status: " + status);
			console.dir(xhr);
		},
		async : true,
		cache : false
	});

}

function getAvailableModels(detection) {
	if(document.getElementById('imageOptions').value == "defaultOptions")
		var options = 'none';
	else
		var options = document.getElementById('imageOptions').value;

	$.ajax({
		type : "GET",
		url : "matlabInfo.php?infoRequest=modelList&options="+options,
		dataType : "json",
		success : function(result) {
			detection.setAvailable(result);
		},
		error : function(xhr, status, errorThrown) {
			console.log("Error: " + errorThrown);
			console.log("Status: " + status);
			console.dir(xhr);
		},
		async : true,
		cache : false
	});

}

/*function startDetection() {
	// data['options']
	// data['multi'] / data['prior'] / data['consensus'] / data['sift'] /
	// data['wedges']
	// data['detectAll'] boolean
	// data['detect'][] signs to detect
	var data = {};

	// options
	if(document.getElementById('imageOptions').value == "defaultOptions")
		data['options'] = 'none';
	else
		data['options'] = document.getElementById('imageOptions').value;

	getAvailableModels();


	var error = false;
	var errorField = document.getElementById("errorField");
	var errorFieldAlg = document.getElementById("errorField2");
	errorField.innerHTML = "";
	errorFieldAlg.innerHTML = "";
	var msg = "";
	var msg2 = "";
	// First, determine if all signs have to be detected or just some of them:
	if (document.getElementById("detectAll").classList
			.contains('statusSelected')) { // Detect ALL
		data['detectAll'] = true;
	} else { // Detect some
		data['detectAll'] = false;
		// close the list of available signs of open
		document.getElementById('modelList').style.display = 'none';

		// First, parse the text:
		var userData = document.getElementById('selectedSign').value;
		var parsedData = userData.split(",");
		//var pad = "000";
		for ( var i = 0; i < parsedData.length; i++) {
			// Go over the indicated signs: pad them AND check if those are
			// numbers!!
			// For some signs: check if the models are available!
			var toDetect = parseInput(parsedData[i]);

			if (toDetect.label.length > 3 || toDetect.newEntry) {
				error = true;
				msg = "Invalid label";
				break;
			}

			if (getAvailableModels.data[parseInt(toDetect.label)] == 0) {
				error = true;
				msg = "No model for sign " + toDetect.label + " ("+toDetect.newName+")";
				break;
			}
			parsedData[i] = toDetect.label;

		}

		data['detect'] = parsedData;
	}



	// Get the methods to be used

	data['multi'] = (document.getElementById('multi').checked) ? 1 : 0;
	data['prior'] = (document.getElementById('prior').checked) ? 1 : 0;
	data['sift'] = (document.getElementById('SIFT').checked) ? 1 : 0;
	data['wedges'] = (document.getElementById('edge').checked) ? 1 : 0;
	data['consensus'] = (document.getElementById('consensus').checked) ? 1 : 0;
	data['fast'] = (document.getElementById('fast').checked) ? 1 : 0;
	data['ngram'] = (document.getElementById('ngram').checked) ? 1 : 0;

	if(data['multi'])
		{
			error = !mainInfo['algorithms']['multi'] || error;
			msg2 = "Multi-Class not available\n";
		}
	if(!mainInfo['algorithms']['all'])
		{
			error = !mainInfo['algorithms']['all'] || error;
			msg2 = msg2 + "General detection not possible!";
		}
	if (error) {
		errorField.innerHTML = msg;
		errorField2.innerHTML = msg2;
		return;
	}
	setPopUp();


	// send the call!

	$.ajax({
		type : "POST",
		url : "detect.php",
		data : data,
		// processData: false,
		// contentType: "application/json",
		cache : false,
		error : function() {
			console.log("error calling detection");
			return;
		},
		success : function(result) {
			result = JSON.parse(result);
			detectionInfo.ID = result.detectionID;

		}
	});

	// Show the new dialog
	document.getElementById('matlabOutput').value = "Calling matlab...\n";
	setPopUp('matlabStream');

	// Now call the streaming function in one sec!
	setTimeout('streamMatlab()', 1000);
}*/

function startDetection() {

	var data = {};

	// options
	data['tab_scale'] = document.getElementById('scale_val').value;
	data['model_version'] = document.getElementById('model_version').value;
	
	// error handling
	var error = false;
	var errorFieldDet = document.getElementById("errorFieldDet");
	errorFieldDet.innerHTML = "";

    // close detection popup
    setPopUp();
    // remove scale pattern
    clearScalePattern();

	// send the call!
	$.ajax({
		type : "POST",
		url : "detect.php",
		data : data,
		// processData: false,
		// contentType: "application/json",
		cache : false,
		error : function() {
			console.log("error calling detection");
			return;
		},
		success : function(result) {
            if (result.trim()) {
            	result = JSON.parse(result);
            	detection_success = result.detection;
            	if (detection_success) {
                    // clear detection window and open load results
                    //loadResults();
                    oldDetectionsWindow.show();
            	} else {
            	    // handle error
            	    // open detection pop up and display error
                    setPopUp('popDetect');
                    errorFieldDet.innerHTML = "Tablet image too large! Select smaller scale or cut image!";
            	}

            } else {
                // open detection pop up and display error
                setPopUp('popDetect');
                errorFieldDet.innerHTML = "Detector is offline!";
                //return;
            }
		}
	});

}

/* function startDetection() {
	// data['options']
	// data['multi'] / data['prior'] / data['consensus'] / data['sift'] /
	// data['wedges']
	// data['detectAll'] boolean
	// data['detect'][] signs to detect
	var data = {};

	// options
	if(document.getElementById('imageOptions').value != "defaultOptions")
		detectionInfo.data.options = document.getElementById('imageOptions').value;

	var error = false;
	var errorField = document.getElementById("errorField");
	var errorFieldAlg = document.getElementById("errorField2");
	errorField.innerHTML = "";
	errorFieldAlg.innerHTML = "";

	// First, determine if all signs have to be detected or just some of them:
	if (document.getElementById("detectAll").classList
			.contains('statusSelected')) { // Detect ALL
		detectionInfo.parseUserInput("all");
	} else { // Detect some

		// close the list of available signs of open
		document.getElementById('modelList').style.display = 'none';

		// First, parse the text:
		var userData = document.getElementById('selectedSign').value;
		if(!detectionInfo.parseUserInput(userData))
		    {
		        errorField.innerHTML = detectionInfo.getErrorMessage(0);
		        errorField2.innerHTML = detectionInfo.getErrorMessage(1);
		        return;
	        }
	}



	// Get the methods to be used

	detectionInfo.data['prior'] = (document.getElementById('prior').checked) ? 1 : 0;
	detectionInfo.data['fast'] = (document.getElementById('fast').checked) ? 1 : 0;
	detectionInfo.data['ngram'] = (document.getElementById('ngram').checked) ? 1 : 0;

	setPopUp();

	// send the call!

    detectionInfo.start();

} */


function switchStream()
{
	streamChange = false;
	var temp;
	temp = document.getElementById('matlabOutput').value;
	$('#verbose').toggleClass('statusSelected');
	verbose = !verbose;
	document.getElementById('matlabOutput').value = verboseBuffer;
	verboseBuffer = temp;
}

function streamMatlab() {
	// thsi function calls the server and reads matlab's runnign output
	// it will end and set a timeout to itself!
	$.ajax({
				type : "GET",
				url : "streamMatlab.php?verbose="+verbose,
				dataType : "json",
				success : function(result) {
					// some nice display to show it is working
					if (document.getElementById("pingLeft").style.backgroundColor == "white") {
						document.getElementById("pingLeft").style.backgroundColor = "green";
						document.getElementById("pingRight").style.backgroundColor = "white";
					} else {
						document.getElementById("pingLeft").style.backgroundColor = "white";
						document.getElementById("pingRight").style.backgroundColor = "green";
					}

					// now check the data
					if (result['end'] == "true") // server done
					{
						if (!(result['content'] == 'waiting')) // just in case
																// the server
																// was done but
																// no new
																// information
																// was available
						document.getElementById('matlabOutput').value += result['content'];
						document.getElementById('matlabOutput').value += "Detection done!\nClick ok to display";
						document.getElementById('closeStream').style.display = "block";
						return;
					}
					if (result['content'] == 'waiting') // server is waiting for
														// information, don't
														// output!
					{
						console.log("Im Matlab nichts neues");
						setTimeout('streamMatlab()', 1000);
						return;
					}
					// output the new info
					document.getElementById('matlabOutput').value += result['content'];

					// server isn't done, call again in 1s
					setTimeout('streamMatlab()', 1000);

				},
				error : function(xhr, status, errorThrown) {
					console.log("Error: " + errorThrown);
					console.log("Status: " + status);
					console.dir(xhr);
				},
				async : true,
				cache : false
			});
	if(streamChange)
		switchStream();

}

function ping() {
	// Just check for connection
	$.ajax({
		type : "GET",
		url : 'pong.php',
		dataType : "json",
		success : function(result) {
			var pong = document.getElementById("ping");
			if (result['ping'] == "pong") {
				if (pong.style.backgroundColor == "green")
					pong.style.backgroundColor = "lime";
				else
					pong.style.backgroundColor = "green";

				timer = window.setTimeout(ping, 720000);
			} else {
				pong.style.backgroundColor = "red";
			}
		},
		error : function(xhr, status, errorThrown) {
			console.log("Error: " + errorThrown);
			console.log("Status: " + status);
			console.dir(xhr);
		},
		async : true,
		cache : false
	});

}

function saveCorrections()
{
//	corrections =[];
//	boxes.forEach(function(element, index, array) {
//			if (element != null)
//				corrections.push(element.boxCorrections()); // Maybe corrections.push(element); Just send the whole boxes as is? -> need to serialize!!!
//
//	});

	var data = {};
	data = { 'corrections': JSON.stringify(boxes), 'detectionID': detectionInfo.ID};
	$.ajax({
			type : "POST",
			url : "backupCorrections.php",
			data : data,
			cache : false,
			error : function() {
				console.log("Error saving corrections!");
				window.alert("An error ocurred");
				return;
			},
			success : function(result) {

			}
		});
}

function restoreBackup()
{
	boxes = [null];
	$.ajax({
		type : "GET",
		url : 'backupCorrections.php',
		dataType : "json",
		success : function(result) {
			var jsonResult = JSON.parse(result.corrections);
			detectionInfo.ID = result.detectionID["detectionID"];

			for(var i=1;i<jsonResult.length;i++)
			{
			  var box = new boundingBox();
			  box.jsonBox(jsonResult[i]);
			  box.svgBox();
			  boxes.push(box);

			}
			$("rect").on("mousedown", rectangleMouseDown);
			$("rect").on("mouseover", rectangleOver);
			$("rect").on("mouseover", rectangleOver);
			$("rect").attr("pointer-events", "all");
			document.getElementById("slider").disabled = false;
			loadModels();
			setTraining();
			if (colorize)
				colorizeConfidence();
			correctMode();
		},
		error : function(xhr, status, errorThrown) {
			console.log("Error: " + errorThrown);
			console.log("Status: " + status);
			console.dir(xhr);
		},
		async : true,
		cache : false
	});
	console.log("dumdidum");

}

function refreshInfo()
{
	var e = document.getElementById('imageOptions');
	var options = e.options[e.selectedIndex].value;

		$.ajax({
			type : "GET",
			url : "matlabInfo.php?infoRequest=algorithms&options="+options,
			dataType : "json",
			async : false,
			cache : false,
			error : function() {
				console.log("error calling for Info!");
				return;
			},
			success : function(result) {
				mainInfo['algorithms']=result;
				if(!mainInfo['algorithms']['multi'])
				{
				document.getElementById('multi').disabled = true;
				document.getElementById('multi').checked = false;
				}
				else
				{
					document.getElementById('multi').disabled = false;
					document.getElementById('multi').checked = true;
					}
			}
		});
}

function startRetrain()
{
    verboseBuffer ="";

	// read the checkboxes
	annotations = [];
	var form = document.getElementById("availableAnnotations");
	// annotations[i] = {"annotation":document.forms[2][i].id,"collection":document.forms[2][i].value};
	for (var i=0; i < form.length; i++)
		{
			if(form[i].checked)
					//annotations[i] = form[i].value;
				annotations[i] = {"annotation":document.form[i].name,"collection":document.form[i].value};
		}

	console.log(annotations);
	var list = data.fpList;
	var pad = "000";
	for ( var i = 0; i < list.length; i++)
		list[i] = (pad + (list[i])).slice(-pad.length);

	// now call php!
	var data = {};
	// data = {'toTrain': parsedData, 'annotations':annotations, 'target':'none', 'reTrain':retrain};
	// annotations[i] = {"annotation":document.forms[2][i].id,"collection":document.forms[2][i].value};
	data = {'toTrain': list, 'annotations':annotations, 'target':'none', 'reTrain':'1'};
	JSON.stringify(data);
	console.log(data);

	$.ajax({
		type : "POST",
		url : "startTraining.php",
		data : data,
		// processData: false,
		// contentType: "application/json",
		cache : false,
		error : function() {
			console.log("error calling training");
			return;
		},
		success : function(result) {


		}
	});
	// Show the new dialog
	document.getElementById('reTrain').style.display='none';
	document.getElementById('matlabOutput').value = "Calling matlab...\n";
	setPopUp('matlabStream');

	// Now call the streaming function in one sec!
	setTimeout('streamMatlab()', 1000);
}

function prepareRetrain()
{
	// this will be only possible after saving the data!
	for(var i=0;i<data.fpList.length;i++)
	{
		document.getElementById('retrainData').innerHTML += data.fpList[i]+" ";
	}

	// now get the available annotations  - DONE by PHP right now, might change this to a dynamic approach later on
	/*
	$.ajax({
		type : "GET",
		url : "matlabInfo?infoRequest=annotations",
		// processData: false,
		// contentType: "application/json",
		cache : false,
		error : function() {
			console.log("error calling training");
			return;
		},
		success : function(result) {
			var form = document.getElementById("availableAnnotations");
			result = JSON.parse(result);
			for(i=0;i<result.length;i++)
			{
				var checkbox = document.createElement('input');
				checkbox.type = "checkbox";
				checkbox.name = result[i];
				checkbox.value = result[i];
				checkbox.id = result[i];
				checkbox.checked = true;

				var label = document.createElement('label');
				label.htmlFor = result[i];
				label.appendChild(document.createTextNode(result[i]));

				form.appendChild(checkbox);
				form.appendChild(label);
				if((i+1)%3 == 0)
			        document.getElementById("availableAnnotations").innerHTML += "<br/>";

			}
			document.getElementById('startRetrain').style.display='inline-block';
		}
	});
	*/
	setPopUp('retrainPopUp');
}

function localAnnotation(doAction)
{
	if(doAction == "start")
		{
			document.getElementById("loadAnnotation").style.display = 'block';
			document.getElementById("fileField").reset();
			return;
		}
	if(doAction == "cancel")
		{
			document.getElementById("loadAnnotation").style.display = 'none';
			$("#error").text("");
			return;
		}


	var control = document.getElementById("annotationFile");
	var reader = new FileReader();

        reader.readAsText(control.files[0]);
        reader.onload = function(event) {
            var data = event.target.result;
            var parser = new DOMParser();
            var xmlData = parser.parseFromString(data, "application/xml");
            if (xmlData.firstElementChild.nodeName == "parsererror")
            	{
            		$("#error").text("Invalid File");
            		return;
            	}
            document.getElementById("loadAnnotation").style.display = 'none';
            xmlProcess(xmlData);
            trackChanges.changed();
            annotationsLoaded = true;
        };
        reader.onerror = function(event) {
            console.error("File could not be read! Code " + event.target.error.code);
        };

}
function localImage(doAction)
{


	if(doAction == "start")
	{
		if(annotationsLoaded)
			clearAnnotations();
		document.getElementById("loadImage").style.display = 'block';
		document.getElementById("fileField").reset();
		return;
	}
	if(doAction == "cancel")
	{
		document.getElementById("loadImage").style.display = 'none';
		$("#error").text("");
		return;
	}


	document.getElementById("loadImage").style.display = 'none';
	var fileInput = document.getElementById("imageFile");
	var file = fileInput.files[0];
	var imageType = /image.*/;
	var svgimg = document.getElementById("image");
	var svgthumb = document.getElementById("thumb");
	if (file.type.match(imageType)) {
	  var reader = new FileReader();
//  document.getElementById("loading").style.display="block";
	  reader.readAsDataURL(file);
	  reader.onload = function(e) {


	    // Create a new image.
	    var img = new Image();
	    var svgMaster = document.getElementById("containerSVG");
	    // Set the img src property using the data URL.
		img.src = reader.result;
		//document.getElementById("loading").style.display="none";
	    // Add the image to the page.
		svgMaster.setAttributeNS(null,'height',img.height);
		svgMaster.setAttributeNS(null,'width',img.width);
		svgimg.setAttributeNS(null,'height',img.height);
		svgimg.setAttributeNS(null,'width',img.width);
		svgimg.setAttributeNS(null,'x','0');
		svgimg.setAttributeNS(null,'y','0');
		svgimg.setAttributeNS('http://www.w3.org/1999/xlink','href', reader.result);

		svgthumb.setAttributeNS(null,'height',img.height);
		svgthumb.setAttributeNS(null,'width',img.width);
		svgthumb.setAttributeNS(null,'x','0');
		svgthumb.setAttributeNS(null,'y','0');
		svgthumb.setAttributeNS('http://www.w3.org/1999/xlink','href', reader.result);

		svgimg.setAttributeNS(null, 'visibility', 'visible');
		//svgimg.setAttributeNS(null, 'id', 'image');
		//$('svgMaster').append(svgimg);

		x = $("#image").offset().left;
		y = $("#image").offset().top;
		svgElement = document.getElementById("image");
		svgElement.addEventListener("click", imageClicked);
		svgElement.addEventListener("mouseover", imageOver);

		 imageHeight = svgElement.getAttribute("height");
		 imageWidth =  svgElement.getAttribute("width");

		 x = $("#image").offset().left;
		 y = $("#image").offset().top;
		 svgElement = document.getElementById("image");
		// Adjust zoom to let image fit on screen
			if(imageWidth < window.outerWidth)
				{
					zoom = 100;
				}
			else
				if(imageWidth*0.75 < window.outerWidth)
					{
						zoom = 75;
					}
				else
					if(imageWidth*0.5 < window.outerWidth)
						{
							zoom = 50;
						}
					else
						zoom = 25;

			document.getElementById("zoom").value = zoom;
			resizeEverything(zoom);

		document.getElementById("clear").style.display = 'block';
		//document.getElementById("loadLocal").style.display = 'block';
	//	document.getElementById("saveLocal").style.display = 'block';


	  };

	}

}

// Dictionary Functions
//
//function Dictionary(){
//	var mainDictionary = Array();
//
//	this.prototype.prepare = function(){};
//
//	this.prototype.find = function(){};
//
//	this.prototype.askNewEntry = function(){};
//
//	this.prototype.update = function(){};
//
//	this.prototype.checkChanges = function(){};
//
//	this.prototype.sendChanges = function(){};
//}
function dictionaryPrepare()
{
	$.ajax({
		type : "GET",
		url : "matlabInfo.php?infoRequest=dictionary",
		dataType : "json",
		async : false,
		cache : false,
		processData: false,
		error : function() {
			console.log("error calling for startup Info!");
			return;
		},
		success : function(result) {

			// now flip this thing!!!

			for(var id in result)
				{
				if(result.hasOwnProperty(id)){
					var newId = ("000" + (id)).slice(-3);
					dictOrdered[newId] = result[id][0];
					for(var i = 0; i< result[id].length;i++)
						 {
                            if(i!=1) {
							    var newId = ("000" + (id)).slice(-3);
							    dictionary[result[id][i].toLowerCase()] = newId;  // store the dictionary!
							    dictionary[unicodize(result[id][i].toLowerCase())] = newId;
							    // here, expand to accents instead of numbers!
							    dictionary[setAccents(unicodize(result[id][i].toLowerCase()))] = newId;
                            } else {
                                aDictUnicode[newId] = result[id][1];
                            }
                            
						 }}
					usedLabels[parseInt(id)] = 1; // index all used labels
				}

			for(var i = 1; i<= usedLabels.length; i++)
				{
					if(typeof usedLabels[i] == "undefined")
						{
						nextLabel = ("000" + i).slice(-3);
						break;
						}
				}
			if( nextLabel == null) // No empty spaces in the array
				{
					nextLabel = ("000"+usedLabels.length).slice(-3);
				}
		}
	});
	dictionaryRefresh();
}


function dictionaryUpdate()
{
	var editElement = document.getElementById("dictionaryEdit");
	var newID = parseInput(editElement.value); // in case the user entered an existent name!
	var newName = document.getElementById("enteredLabel").innerHTML;
	var warning = document.getElementById("dictWarning");


	// Re-doing this for text-based annotations!
	// TODO
	// Check for alphanumeric, skip if 000!
	if (newID != null && newID.label != "000")
		{
		var newEntry = newID.label;
		document.getElementById('updateDictionary').style.display = 'none';
		warning.innerHTML = "";
		editElement.value = '';
		warning.style.display = "none";
		dictionary[newName.toLowerCase()] = newEntry;
		}
	else
		{
			warning.innerHTML = "Please enter a valid name or numeric label different from 0!";
			warning.style.display = "block";
			return;
		}

	//update the data for overRectangle if needed
	if(typeof dictOrdered[newEntry] == "undefined")
		{
			dictOrdered[newEntry] = newName;
		}
	// now update the dictionary on the server side
	var width = boxes[activeRectangle].xmax - boxes[activeRectangle].xmin;  // dimensions to eventually generate thumbs!
	var height = boxes[activeRectangle].ymax - boxes[activeRectangle].ymin;
	var data = {};
	data = {'id': newEntry, 'label':newName, 'x':boxes[activeRectangle].xmin ,'y':boxes[activeRectangle].ymin , 'width':width, 'height':height};
	JSON.stringify(data);
	console.log(data);

	$.ajax({
		type : "POST",
		url : "updateDictionary.php",
		data : data,
		// processData: false,
		// contentType: "application/json",
		cache : false,
		error : function() {
			console.log("error calling update function");
			return;
		},
		success : function(result) {


		}
	});

	// And now, save the new annotation!
	dictUpdateOpen = false;
	storeSignInfo();
	dictionaryRefresh();
}

function openDictionary()
{
	var frame =document.getElementById('testDIV');
	var dictionary = document.getElementById('dictionary');

	if(dictionary.classList.contains("dictionaryOpen"))
		{
		//document.getElementById('dictionary').innerHTML = "";
		frame.style.overflow = "hidden";
		frame.style.height = "1.75em";
		document.getElementById('toggle').innerHTML = "<b>&#x25BE;</b>";
        dictionary.classList.remove("dictionaryOpen");
		}
	else
//	if(windowObjectReference == null || windowObjectReference.closed)
//		windowObjectReference = window.open('listDictionary.php');
//	else
//		{
//		windowObjectReference.close();
//		windowObjectReference = window.open('listDictionary.php');
//		}
	{
		dictionary.style.height = "50em";
        frame.style.height = "";
		frame.style.overflow = "auto";
		dictionaryRefresh();
		document.getElementById('toggle').innerHTML = "<b>&#x25B4;</b>";
        dictionary.classList.add("dictionaryOpen");
	}
}

dictionaryRefresh = function()
{
	//if(document.getElementById('testDIV').style.height == "50em") // if not open, ignore
	$.ajax({
		type : "GET",
		url : "listDictionary.php",
		//data : {modelRequest:id, name:alt},
		// processData: false,
		// contentType: "application/json",
		cache : false,
		error : function() {

		},
		success : function(result) {
			document.getElementById('dictionary').innerHTML = result;

		}
	});
}
function parseInput(input)
{	// returns: input == null if not in dictionary, else just the number.
	// trim input!

	input = input.trim();
	// Check if numeric or not
	// If not numeric, check dictionary
	// if not in dictionary -> new window
	// if in dictionary, convert and return,
	// if numeric, just return, as numeric is always ok
	// Output will be: the input, the translation, what kind of input and if unknown label
	var output = {};
	output.newName = input; // original name
	output.label   = "000"; // new numeric label
	output.numeric = false; // was the original numeric?
	output.newEntry = false; // did the original need a new Entry in the dictionary?

	if (input.match(/[0-9a-zA-Z,':]+$/) != null && input != "000")
	{
		// check if only numeric
		if(input.match(/^[0-9]+$/) == null) // nope -> alphanumeric
		{
			// Capitalize
			var temp = input.toLowerCase();
			// check DB
			if(typeof dictionary[temp]!== "undefined") // Part of the database!
			{
				// convert to Number! and send back!
				output.label = dictionary[temp];
				return output;
			}
			else
				{
				// HERE comes the new entry!!!
					output.newEntry = true;
					// not part of the DB: ask for new entry
					var offsets = document.getElementById('signEdit').getBoundingClientRect();
					var top = offsets.top + offsets.height/2;
					var left = offsets.left - offsets.width;
					document.getElementById("updateDictionary").style.top = top+window.scrollY;
					document.getElementById("updateDictionary").style.left = left;
					document.getElementById("enteredLabel").innerHTML = input;

					// in case a number is already assigned to this annotation:
					if(boxes[activeRectangle].symbol != "000")
						{
						document.getElementById("actualLabel").innerHTML = "Current ID: "+boxes[activeRectangle].symbol;
						}
					else
						{
						document.getElementById("actualLabel").innerHTML = "Next Available ID: "+nextLabel;
						document.getElementById("dictionaryEdit").value = nextLabel;
						}
					document.getElementById("updateDictionary").style.display = "block";
					document.getElementById("dictionaryEdit").focus();
					document.getElementById("dictionaryEdit").select();
					dictUpdateOpen = true;
					return output;
				}
		}
		else
		{
			output.numeric = true;
			output.label = ("000" + (input)).slice(input.length);
			if(typeof dictOrdered[output.label] == "undefined")
				output.newName = "N/A";
			else
				output.newName = dictOrdered[output.label].toLowerCase();
			return output; // Only numeric -> data can be used directly
		}

	}else
		return null; // not alfanumeric, not a number

}

function metaData()
{
	this.fields = {};
	this.data   ={};
	var self = this;
	$.ajax({
		type : "GET",
		url : "metaData.php",

		cache : false,
		error : function() {
			console.log("error fetching the gallery");
			return;
		},
		success : function(result) {
			// console.log(result);
			var data = JSON.parse(result);  // JSON.parse(result,self)
			document.getElementById("metaForm").innerHTML = data.layout;
			self.fields = data.fields;
			self.data = data.data;
			// self.loadMeta();
		}
	});
}


metaData.prototype.loadMeta = function(){

	//This processes the fields into the Form.
	for(var  i = 0; i< this.fields.length; i++)
	{
		var thisField = this.fields[i];
		if(typeof(this.data[thisField]) != "undefined")
			document.getElementById(thisField).value = this.data[thisField];
	}
};
metaData.prototype.saveMeta = function()
{
	var data = {};

	data["action"] = "saveData";
	data["fields"] =  {};
	for(var  i = 0; i< this.fields.length; i++)
	{
		var thisField = this.fields[i];
		if(thisField != "-")
			data["fields"][thisField] = document.getElementById(thisField).value;
	}

	$.ajax({
		type : "POST",
		url : "metaData.php",
		data : data,
		//processData : false,
		//contentType : "application/json",
		cache : false,
		error : function(jqXHR, textStatus, errorThrown) {
			alert(errorThrown);
		},
		success : function() {
			setPopUp();
		}
	});

}

function unicodize(str)
{
	var number = Array('0','1','2','3','4','5','6','7','8','9');
	var rep = Array("₀", "₁", "₂", "₃",	"₄", "₅", "₆", "₇",	"₈", "₉");
	/*for(var i = 0; i<10;i++)
		{
			str = str.replace(number[i],"*"+number[i]);
		}
	for(var i = 0; i<10;i++)
	{
		str = str.replace("*"+number[i],"&#832"+number[i]);
	}*/

	for(var i = 0; i<10;i++)
	{
		str = str.replace(number[i],rep[i]);
	}
	for(var i = 0; i<10;i++) // twice, for numbers > 9
	{
		str = str.replace(number[i],rep[i]);
	}
	/*str = str.replace(/sz/g,"&#353");
	str = str.replace(/SZ/g,"&#352");
	str = str.replace(/t,/g,"&#7789");
	str = str.replace(/T,/g,"&#7788");
	str = str.replace(/s,/g,"&#7779");
	str = str.replace(/S,/g,"&#7778");
	str = str.replace(/h/g,"&#7723");
	str = str.replace(/H/g,"&#7722");
	str = str.replace(/s'/g,"ś");
	str = str.replace(/S'/g,"Ś");
	str = str.replace(/'/g,"ʾ");*/

	str = str.replace(/sz/g,"š");
	str = str.replace(/SZ/g,"&#352");
	str = str.replace(/t,/g,"ṭ");
	str = str.replace(/T,/g,"&#7788");
	str = str.replace(/s,/g,"ṣ");
	str = str.replace(/S,/g,"&#7778");
	str = str.replace(/h/g,"ḫ");
	str = str.replace(/H/g,"&#7722");
	str = str.replace(/s'/g,"ś");
	str = str.replace(/S'/g,"Ś");
	str = str.replace(/'/g,"ʾ");

	return str;
}

function setAccents(sign)
{
	var rep = Array("₀", "₁", "₂", "",	"₄", "₅", "₆", "₇",	"₈", "₉");
	var lastLetter = sign.length -1;

	var searchVocal = function(sign){

	};

	if(lastLetter == 0) // only one letter, send back
		return sign;

	if(sign[lastLetter-1] in rep) // sign has 2 numbers, return!
		return sign;

	if(sign[lastLetter] == "₂" || sign[lastLetter] == "₃")
		{
			var idx = 0;
			var vowels = Array("a","e","i","u");
			var vowels2 = Array("á", "é", "í", "ú");
			var vowels3 = Array("à", "è", "ì", "ù");

			for(var i = 0; i < sign.length; i++)
				{
					idx = vowels.indexOf(sign[i]);
					if(idx != -1)
					{
						if(sign[lastLetter] == "₂")
							sign = sign.substr(0,i) + vowels2[idx] + sign.substr(i+1, lastLetter-i-1);

						if(sign[lastLetter] == "₃")
							sign = sign.substr(0,i) + vowels3[idx] + sign.substr(i+1, lastLetter-i-1);

						break;
					}
				}

		}
	return sign;
}
function send()
{
	var data = {};
	data.info = generalInfo; // Always send current image!

}

function get()
{

}

function showSigns(signList)
{
	var boundingBoxes = document.getElementsByTagName("rect");
	var visible = 0;
	for(var i=0; i< boundingBoxes.length; i++)
	  {
		if(signList.has(boundingBoxes[i].getAttribute("name")))
			{
				boundingBoxes[i].style.display = "block";
				visible++;
			}
		else
			boundingBoxes[i].style.display = "none";
	  }

	var totalBoxes = boxes.length-1;
	document.getElementById("totals").innerHTML = "Boxes: "+visible+" / "+totalBoxes;

}

function showSign(sign)
{
  var signNum = dictionary[sign];

  for(var i =1; i< boxes.length; i++)
  {
    if(boxes[i].symbol == signNum)
      boxes[i].svg.setAttribute("display","true");
    else
      boxes[i].svg.setAttribute("display","none");
  }
}

function adjustSize(useConfidence)
{

	var confidence = (useConfidence)?document.getElementById("slider").value:0;
	var score = document.getElementById("sliderAdjustSize").value;

	// First, get sizes for boxes over the score
	var sizes = [];
	var tempBoxes = [];
	for(var i=1; i< boxes.length; i++)
		{
			if (boxes[i] != null)
				if (boxes[i].confidence >= score)
				{
					var height = Math.round(boxes[i].ymax-boxes[i].ymin);
					var width =  Math.round(boxes[i].xmax-boxes[i].xmin);
					sizes.push({"h":height,"w":width, "a":width*height, "p": 0, "sign": boxes[i].symbol});
					tempBoxes.push(boxes[i]);
				}
		}

	sizes.sort(function(a,b){
		return a.a - b.a;
	});
	var median;

	if(sizes.length % 2 == 0)
		{
			median = (sizes[sizes.length/2].a +  sizes[sizes.length/2 -1].a)/2;
		}
	else
		median = sizes[Math.round(sizes.length/2)].a;

	var percent;

	for(var i = 0; i < sizes.length; i++)
		{
			sizes[i].p = sizes[i].a / median;
		}
	for(var i = 1; i < boxes.length; i++)
	{
		var height = Math.round(boxes[i].ymax-boxes[i].ymin);
		var width =  Math.round(boxes[i].xmax-boxes[i].xmin);
		var p = height*width/median;
		if(p > detectionInfo.config.maxSizeRatio || p < detectionInfo.config.minSizeRatio || boxes[i].confidence < confidence)
			{
				//console.log("Sign "+boxes[i].id+" non-conform: "+p);
				boxes[i].svg.setAttribute("display","none");
				boxes[i].show = 0;
			}else
				{	//console.log("Sign "+boxes[i].id+" conform: "+p);
					boxes[i].svg.setAttribute("display","true");
					boxes[i].show = 1;
				}
	}

}

function adjustmentUpdate(value)
{
	$("#sliderAdjustValue").text(document.getElementById("sliderAdjustSize").value);
}


/*function updateSignList(source)
{
	return;
	docFragment = document.createDocumentFragment();
	switch(source)
	{
	case "detection":
		detectionInfo.detectedSigns.forEach(function(element, element2, set) {
			var checkbox = document.createElement('input');
			checkbox.type = "checkbox";
			checkbox.id = "c"+element;
			checkbox.checked = true;

			var label = document.createElement('label')
			label.htmlFor = "c"+element;
			label.appendChild(document.createTextNode(dictOrdered[element]));
			docFragment.appendChild(checkbox);
			docFragment.appendChild(label);
		});
		break;
	case "annotation":
		break;
	}

	document.getElementById("searchedSigns").innerHTML = "";
	document.getElementById("searchedSigns").appendChild(docFragment);

}*/

function updateVisible()
{
	for(var i =1; i < boxes.length; i++)
	{


		if(document.getElementById("c"+boxes[i].symbol).checked)
			boxes[i].svg.setAttribute("display","true");
		else
			boxes[i].svg.setAttribute("display","none");

	};

}

function maximumSuppression(maxOverlap)
{
	document.getElementById(boxes[1].id).setAttribute("display","true");

	var intersect = [0.0,0.0,0.0,0.0];
	var iw = 0.0;
	var ih = 0.0;
	var interArea = 0.0;
	var currentArea = 0.0;
	var overlap = 0.0;
	var previousValueBigger = parseFloat(document.getElementById("sliderNonMax").innerHTML) > maxOverlap;
	var currentThreshold = parseFloat(document.getElementById("slider").value);

	// set all boxes to "show" first
	if(!previousValueBigger)
		for(var i = 2; i < boxes.length; i++) // First ist allways best!
		{
			if(boxes[i].confidence > currentThreshold)
				boxes[i].show = 1;
		}

	for(var i = 2; i < boxes.length; i++) // First ist allways best!
	{
		if(boxes[i].show == 0)
			continue;

		for(var j = 1; j <boxes.length; j++) // higher boxes already eliminated or tested!
			{

				if(i == j)
					continue;
				/*if(previousValueBigger)
					if(boxes[j].svg.getAttribute("display") == "none")
						{
							boxes[j].show = 0;
							continue;
						}*/
				if(boxes[j].show == 0)
					continue;

				intersect[0] = Math.max(boxes[i].xmin, boxes[j].xmin);
				intersect[1] = Math.max(boxes[i].ymin, boxes[j].ymin);
				intersect[2] = Math.min(boxes[i].xmax, boxes[j].xmax);
				intersect[3] = Math.min(boxes[i].ymax, boxes[j].ymax);

				iw = (intersect[2]-intersect[0]+1);
				ih = (intersect[3]-intersect[1]+1);

				if(iw > 0 && ih >0)
				{
					interArea = iw * ih

					currentArea =  (boxes[j].xmax-boxes[j].xmin+1)*(boxes[j].ymax-boxes[j].ymin+1);

					overlap = interArea / currentArea;

					if(overlap > maxOverlap) //detectionInfo.config.maxOverlap)
						{
							if(boxes[j].confidence < boxes[i].confidence)
								boxes[j].show = 0;
							else
								boxes[i].show = 0;
						}


				}


			}
	}

	var visible = 0;
	for(var i = 1; i < boxes.length; i++)
		if(boxes[i].show != 0)
			{
				boxes[i].svg.setAttribute("display","true");
				visible += 1;
			}
		else
			boxes[i].svg.setAttribute("display","none");


	var totalBoxes = boxes.length-1;
	document.getElementById("totals").innerHTML = "Boxes: "+visible+" / "+totalBoxes;

	document.getElementById("sliderNonMax").innerHTML = maxOverlap;
	document.getElementById("nonmax").value = maxOverlap;
}


function showLabels(bShowUnicode)
{

	if(document.getElementById("svgLabels") == null)
		{
			 //var divMaster = document.createElement("div");
			//divMaster.id = "toolTipBlock";// get median height:
			var height = [];
			for(var i = 1; i < boxes.length; i++)
				{
					height.push(Math.round(boxes[i].ymax-boxes[i].ymin));
				}

			height.sort();

			if(height.length%2 == 0)
				var median = height[height.length/2];
			else
				var median = (height[Math.floor(height.length/2)]+height[Math.floor(height.length/2)+1])/2;

			median = Math.round(median/3);
			var svgLabels = document.createElementNS(xmlns, "g");
			svgLabels.id = "svgLabels";

			if(train)
				var confidence = document.getElementById("slider").value;
			else
				var confidence = 0;
			for(var i = 1; i < boxes.length; i++)
			{
				//if(boxes[i].) check confidence value
				/*var div = document.createElement("div");
				//div.setAttribute("style", (boxes[3].ymin+boxes[3].ymax)/2);
				//div.setAttribute("left", (boxes[3].xmin+boxes[3].xmax)/2);
				div.style.left =boxes[i].ymin+x;
				div.style.top =boxes[i].xmin+y;
				div.setAttribute("class", "tooltip");
				div.style.background = "white";
				div.style.display = "block";
				divMaster.appendChild(div);*/

				if(boxes[i].confidence < confidence || boxes[i].show == 0) //boxes[i].svg.getAttribute("display") != "true")
					continue;

				var rect = document.createElementNS(xmlns, "rect");

				rect.setAttribute("x", 3);
				rect.setAttribute("y", 3);
				rect.setAttribute("width", 6);
				rect.setAttribute("height", 6);

				var elem = document.createElementNS(xmlns, "text");

				elem.setAttribute("x", (boxes[i].xmin/2+boxes[i].xmax/2));
				elem.setAttribute("y", boxes[i].ymax-10);
				elem.setAttribute("name", i);
				elem.setAttribute("stroke", "black");
				elem.setAttribute("font-size",median);
				elem.setAttribute("fill", "black");
if(bShowUnicode) {
    var sIndex = ("000" + boxes[i].symbol).slice(-3);   
    elem.innerHTML = aDictUnicode[sIndex];
    elem.setAttribute("font-family", "assurbanipal");
} else {
				elem.innerHTML = unicodize(boxes[i].readableSymbol.toLowerCase());
}
				svgLabels.appendChild(rect);
				svgLabels.appendChild(elem);

			}

		//	document.body.appendChild(divMaster);
			document.getElementById("boxes_group").appendChild(svgLabels);



			for(var i = 1; i < svgLabels.childNodes.length; i += 2)
				{
					var elem = svgLabels.childNodes[i-1];
					var label = svgLabels.childNodes[i];
					var j = document.getElementById("svgLabels").childNodes[i].getAttribute("name");
					var labWidth = label.getBBox().width;
					var labHeight = label.getBBox().height;

					var boxMiddle = (boxes[j].xmax - boxes[j].xmin)/2 + parseFloat(boxes[j].xmin);

					label.setAttribute("x",boxMiddle - labWidth/2);

					elem.setAttribute("x", label.getBBox().x);
					elem.setAttribute("y", label.getBBox().y);
					elem.setAttribute("width", labWidth);
					elem.setAttribute("height", labHeight);
					elem.setAttribute("fill", "white");

				}


		}
	else
		{
			document.getElementById("boxes_group").removeChild(document.getElementById("svgLabels"));
		}


}


function cleanUp()
{
	adjustSize(true);
	confidenceUpdate(0.3);
	maximumSuppression(detectionInfo.config.maxOverlap);
}

/* LEGACY : n-grams
function drawLines()
{
	if(document.getElementById("lineGroup") == null)
	{
		var group =  document.createElementNS(xmlns, "g");
		group.id = "lineGroup";
		var lines = detectionInfo.lines.bigLines;

		for (var i = 0;i < lines.length; i++)
		{
			var elem = document.createElementNS(xmlns, "line");
      var num = detectionInfo.lines.points[i].split(" ").length;
      if(num>4)
        elem.setAttribute("stroke", "green");
      else
        elem.setAttribute("stroke", "pink");
			elem.setAttribute("x1", lines[i].x1);
			elem.setAttribute("x2", lines[i].x2);
			elem.setAttribute("y1", lines[i].y1);
			elem.setAttribute("y2", lines[i].y2);
			group.appendChild(elem);
		}

		document.getElementById("svgMaster").appendChild(group);
	}else
		{
		document.getElementById("svgMaster").removeChild(document.getElementById("lineGroup"));
		}

}


function drawNGrams()
{

	if(document.getElementById("ngramGroup") == null)
	{
		var group =  document.createElementNS(xmlns, "g");
		group.id = "ngramGroup";
		var ngramPoints = detectionInfo.lines.points

		for (var i = 0;i < ngramPoints.length; i++)
		{
			var elem = document.createElementNS(xmlns, "polyline");
			elem.setAttribute("stroke", "pink");
			elem.setAttribute("points", ngramPoints[i]);
			elem.setAttribute("fill", "none");
			group.appendChild(elem);
		}
		document.getElementById("svgMaster").appendChild(group);
	}
	else
	{
		document.getElementById("svgMaster").removeChild(document.getElementById("ngramGroup"));
	}
}*/

function parseTransliteration()
{
	var text = document.getElementById("transText").value;
//	var lines = text.split("\n");
//	var signs;
//	var toDetect = new Set();
//	document.getElementById("transTable").innerHTML = "";

	//getAvailableModels();
	//document.getElementById("transText").parentNode.removeChild(document.getElementById("transText"));
	var parsedData = detectionInfo.parseTransliteration(text);

	if(parsedData.lenght == 0)
		return;
	/*var models = []
	for(i in getAvailableModels.data)
		{
			num = ("000"+i).slice(-3);
			models[num] = (getAvailableModels.data[i] == 1)?true:false;
		}*/

	var table = document.createElement("table");


	for(var i = 0; i< parsedData.length; i++)
		{
			var row = document.createElement("tr");
			//signs = lines[i].split(/\.|\s|-/);
			//for (var j = 0; j < signs.length; j++)
			for (var j = 0; j < parsedData[i].length; j++)
				{
					var cell = document.createElement("td");

					if(detectionInfo.data.lines[i][j] != "000" )
						var sign = dictionary[parsedData[i][j].toLowerCase()];
					else
						var sign = parsedData[i][j];

					if(detectionInfo.data.linesStatus[i][j] == 0)
						{
							cell.className = "noModel";
						}
					else
						if(detectionInfo.availableModels[sign])
							cell.className = "yesModel";
						else
							cell.className = "notDetectable";

					cell.innerHTML = parsedData[i][j];

					row.appendChild(cell);

				}
			table.appendChild(row);
		}

	document.getElementById("transTable").appendChild(table);
}

function detection()
{
    this.data = {};
    this.detectedSigns = new Set();
    this.ID = 0;
    this.searchedSigns = [];
    this.algorithms = [];
    this.errorMsg = ["",""];
    this.fullInfo = {};
    this.lines = {};

    this.availableModels = {};

    this.data.multi = 0;
    this.data.sift = 0;
    this.data.wedgses = 0;
    this.data.consensus = 0;
    this.data.fast = 0;
    this.data.ngram = 0;
    this.data.prior = 0;
    this.data.autoanno = 0;

    this.data.options = 'none';

    this.data.detectAll = false;
    this.data.detect = [];

    this.data.annotation = [];
    this.data.annotationOriginal = "";

    this.config = {}
    this.config.maxOverlap = 0.5;
    this.config.maxSizeRatio = 2;
    this.config.minSizeRatio = 0.25;

    getAvailableModels(this);
}

detection.prototype.setConfig =  function(maxOverlap, maxSize, minSize)
{
    if(maxOverlap != null)
        this.config.maxOverlap = maxOverlap;
    if(maxSize != null)
        this.config.maxSizeRatio = maxSize;
    if(minSize != null)
        this.config.minSizeRatio = minSize;
}

detection.prototype.getErrorMessage = function(index)
{
    if(index != 0 && index != 1)
        return "";

    return this.errorMsg[index];
};

detection.prototype.start = function()
{
	$.ajax({
		type : "POST",
		url : "detect.php",
		data : this.data,
		// processData: false,
		// contentType: "application/json",
		cache : false,
		error : function() {
			console.log("error calling detection");
			return;
		},
		success : function(result) {
			result = JSON.parse(result);
			detectionInfo.ID = result.detectionID;

		}
	});

	// Show the new dialog
	if(this.data.autoanno != 1)
	{
	document.getElementById('matlabOutput').value = "Calling matlab...\n";
	setPopUp('matlabStream');

	// Now call the streaming function in one sec!
	setTimeout('streamMatlab()', 1000);
	}else
	{
		document.getElementById("transliteration").style.display = "none";
	}
};

detection.prototype.parseUserInput = function(stringData)
{
    var ok = true;

    if(stringData == "all")
    {
        this.data.detectAll = true
        return ok;
    }

    var parsedData = stringData.split(",");
		//var pad = "000";
    for ( var i = 0; i < parsedData.length; i++) {
			// Go over the indicated signs: pad them AND check if those are
			// numbers!!
			// For some signs: check if the models are available!
		var toDetect = parseInput(parsedData[i]);

		if (toDetect.label.length > 3 || toDetect.newEntry) {
				ok = false;
				this.errorMsg[0] = "Invalid label";
				break;
			}

		if (!this.availableModels[toDetect.label]) {
				ok = false;
				this.errorMsg[1] = "No model for sign " + toDetect.label + " ("+toDetect.newName+")";
				break;
			}
		parsedData[i] = toDetect.label;

	}

    if(!ok)
        this.data.detect = parsedData;

    return ok;
};

detection.prototype.parseTransliteration = function(text)
{
	this.data.annotationOriginal = text;
    var parsedData = [];
    var lines = text.split("\n");
	var parsedLines =[];
	var parsedLinesHuman = [];
	var parsedLinesStatus = []; //half broken, unknow, whole, uncertain
	var signs = [];
	var tempSign = [];
	var broken = false;
	var partBroken = false;
	var store = false;
	var bigGap = false;
	var determinative = false;
	var error = false;
	var superscripts = {"ᵃ":"a", "ᴬ":"a", "ᵇ":"b", "ᴮ":"b", "ᶜ":"c", "ᵈ":"d", "ᴰ":"d",
			 "ᵉ":"e",
			 "ᴱ":"e",
			 "ᶠ":"f",
			 "ᵍ":"g",
			 "ᴳ":"g",
			 "ʰ":"h",
			 "ᴴ":"h",
			 "ⁱ":"i",
			 "ᴵ":"i",
			 "ʲ":"j",
			 "ᴶ":"j",
			 "ᵏ":"k",
			 "ᴷ":"k",
			 "ˡ":"l",
			 "ᴸ":"l",
			 "ᵐ":"m",
			 "ᴹ":"m",
			 "ⁿ":"n",
			 "ᴺ":"n",
			 "ᵒ":"o",
			 "ᴼ":"o",
			 "ᵖ":"p",
			 "ᴾ":"p",
			 "ʳ":"r",
			 "ᴿ":"R",
			 "ˢ":"s",
			 "ᵗ":"t",
			 "ᵀ":"t",
			 "ᵘ":"u",
			 "ᵁ":"u",
			 "ᵛ":"v",
			 "ⱽ":"v",
			 "ʷ":"w",
			 "ᵂ":"w",
			 "ˣ":"x",
			 "ʸ":"y",
			 "ᶻ":"z"};

	var ignore = false;
	var lineNumber = false;

	for(var i = 0; i< lines.length; i++)
		{
			parsedLines[i] = [];
			parsedLinesHuman[i] = [];
			parsedLinesStatus[i] = [];
			//signs = lines[i].split(/\.|\s|-/); // TODO: NUMBERS at the beginning of a line!!!
			lines[i] = lines[i].trim()+" ";  // the last space forces the storage of the last sign!

			for(var j = 0; j< lines[i].length; j++)
				{
				// START with text version, then unicode

					var c = lines[i][j];

					if(j== 0 & !isNaN(c))
						{
							lineNumber = true;
						}
			    // Determinative, ignore {} !!!! CAREFUL!! What if there is another sign directly behind???
					// check for flags

					if(c == '{'  || c == '}' || c == "*" || c == "?" || c == "+" )
						store = true;

					if(c == '<')
						ignore = true;

					if(c == '>')
						ignore = false;

					if(c in superscripts)
						{
							determinative = true;
							c = superscripts[c]; // convert to normal letters
						}

					if(determinative && !(c in superscripts))
						store = true;

					// check for determinatives? -> unicode and stuf... UGH!
					if (c == "_" || c == "!")
						continue;
					// check for broken?
					if(c == '[')
					{
						broken = true;
						continue;
					}

					if(c == '(')
						{
							tempSign = []; //flush the sign/word
							continue;
						}

					if(c == ')')
						{
						 	store = true;
						}
					if(c == '⸢')
					{
						partBroken = true;
						continue;
					}
					if(c == "]")
						{
						store = true;
						}
					if(c == '#' || c == "⸣")
					{
						partBroken = true;
						store  = true;
					}

					if(c == ' ' || c == '.' || c == '-' || c == '—')
						{
							if(broken && c == '.')
							{
								bigGap = true;
								continue;
							}
							if(lineNumber)
							{	tempSign = [];
								lineNumber = false;
								continue;
							}else
								store = true;
						}



					if(store & tempSign.length != 0 & !ignore)
						{
							signs.push(tempSign.join(""));
							store = false;
							if(broken || c == 'x' || c == 'X')
								parsedLinesStatus[i].push(0);
							else
								if(partBroken)
								{
									parsedLinesStatus[i].push(2);
									partBroken = false;
								}
								else
									parsedLinesStatus[i].push(1);
							// flush buffer
							tempSign = [];
						}else
						{
							if(c != " " & c != "-" & c!= "." & c != '{' & c != "?" & c != "+" & c != '<' & c != '>' & c != ']' & c != '}' & c != '—')
								tempSign.push(c);

						//	if(c == 'x' || c == 'X')  // might have jumped over the storage process.
						//		parsedLinesStatus[i].push(0);

							store = false;
							determinative = false;
						}

					if(c == "]")
					{
						broken = false;
						if(bigGap)
						{
							signs.push("...");
							parsedLinesStatus[i].push(0);
							bigGap = false;
						}
					}

					if(c == "⸣" || c== '#')
						partBroken = false;
				}

			for (var j = 0; j < signs.length; j++)
			{
				signs[j] = signs[j].toLowerCase();  // convert to lower case first!
				if(parsedLinesStatus[i][j] == 0)
					{
						if(signs[j] == "...")
							var signNum = "998";
						else
							if(signs[j] in dictionary)
								var signNum = dictionary[signs[j]];
							else
								var signNum = "000";
					}
				else
					{
						if(signs[j] in dictionary)
						{
							var signNum = dictionary[signs[j]];

						}else
						{
							if(signs[j] == "x" || signs[j] == "X")
								var signNum = "000";
							else
							{
								console.log("Sign "+signs[j]+" not found!");
								error = true;
							}
						}
						if(parsedData.indexOf(signNum) == -1 && this.availableModels[signNum])
							 parsedData.push(signNum);
					}
				parsedLines[i].push(signNum);
				parsedLinesHuman[i].push(signs[j]);
			}

			signs = [];

		}

	if(error)
		return [];

    this.data.detect = parsedData;
    this.data.lines = parsedLines;
    this.data.linesStatus = parsedLinesStatus;
    this.data.autoanno = 1;

    return parsedLinesHuman;
};

detection.prototype.setAvailable = function(availableArray)
{
	var num;

	for(var i = 0; i < 1000; i++)
		{
			num = ("000" + i).slice(-3);
			if(availableArray[num] == "undefined")
				this.availableModels[num] = false;
			else
				this.availableModels[num] = (availableArray[i] == 1)?true:false;
		}

}

function oldDetections()
{
	// check if a radio button is selected
	var selected = 0;

	//if(annotationsLoaded)
	//	return;
	if(annotationsLoaded)
	{
		clearAnnotations();
	}

	for(var i = 0; i< this.content.childNodes.length; i += 2) // second child is always br!
	{
		if(this.content.childNodes[i].firstChild.checked)
			{
			selected = this.content.childNodes[i].firstChild.value;
			break;
			}
	}

	if(selected != 0) // Make the call!
	{
		loadResults(selected);
		oldDetectionsWindow.hide();
	}
}

function highlightSignFromDictionary(oEvent) {

	var sRow, sSign;
	unselectSignClass();
	if(oEvent.target.parentElement.id) {
		sRow = oEvent.target.parentElement.id;		
	} else {
		sRow = oEvent.target.parentElement.parentElement.id
	}
	sSign = sRow.slice(-3);
	selectSignClass(sSign);
}
function onMouseDownDictionary(event) {
	var dictionaryDiv = document.getElementById("dictionaryHeader");
	dictionaryDiv.addEventListener("mousemove", onDragDictionary);
	dictionaryDiv.addEventListener("mouseup", onMouseUpDictionary);
	dictionaryDiv.addEventListener("mouseout", onMouseUpDictionary);
	dictionaryDiv.style.cursor = 'move';
}

var onDragDictionary = function(event) {
	var dictionaryDiv = document.getElementById("dictionaryHeader");
	var boundingClientRect = dictionaryDiv.getBoundingClientRect();
	dictionaryDiv.style.top = boundingClientRect.top + event.movementY;
	dictionaryDiv.style.left = boundingClientRect.left + event.movementX;
};

var onMouseUpDictionary = function() {
	var dictionaryDiv = document.getElementById("dictionaryHeader");
	dictionaryDiv.removeEventListener("mousemove", onDragDictionary);
	dictionaryDiv.removeEventListener("mouseup", onMouseUpDictionary);
	dictionaryDiv.style.cursor = 'auto';
};
function updateTotalBoxes() {
	
	if(mode == "boxes") {
		var iNonEmptyBoxes = boxes.filter(Boolean).length;
		document.getElementById("totals").innerHTML = "Boxes: "+ iNonEmptyBoxes;
	} else {
		document.getElementById("totals").innerHTML = "Lines: "+ (lines.length-1);
	}
}

// From https://www.w3schools.com/howto/howto_js_draggable.asp

function dragDictionary(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById("dictionaryHeader")) {
    // if present, the header is where you move the DIV from:
    document.getElementById("dictionaryHeader").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function updateTextInput(val, target) {
  // update target value
  document.getElementById(target).value=val;
  // update scale pattern
  createScalePattern(val);
}


function createScalePattern(val) {
  // create scale pattern
  targetSVG = 'svgMaster';

  // compute relative height (with svgMaster zoom already accounted for thanks to transform property)
  if (val > 0) {
    invVal = 1 / val;
  } else {
    invVal = 0;
  }
  relHeight = 160 * invVal;

  // check if containerGrid exists
  rect = document.getElementById('sampleGrid');
  if (rect) {
      // change pattern size
      grid = document.getElementById('gridPat');
      grid.setAttribute('width', relHeight);
      grid.setAttribute('height', relHeight);

//      rect = document.getElementById('sampleGrid2');
//      // change rectangle size
//      rect.setAttribute('width', relHeight);
//      rect.setAttribute('height', relHeight);

  } else {
      // insert patternContainer
      // https://stackoverflow.com/questions/14208673/how-to-draw-grid-using-html5-and-canvas-or-svg
      pattern = "<defs><pattern id='gridPat' width='128' height='128' patternUnits='userSpaceOnUse'>"
      pattern = pattern + "<path d='M 1000 0 L 0 0 0 5' fill='none' stroke='#a6bddb' stroke-width='10' style='stroke-opacity: .6;'/></pattern></defs>"
      document.getElementById(targetSVG).insertAdjacentHTML('beforeend', pattern);
      // with svgMaster set width and height to 400% in order to handle zoom up to 12.5%
      document.getElementById(targetSVG).insertAdjacentHTML('beforeend', "<rect id='sampleGrid' width='800%' height='800%' fill='url(#gridPat)' />");

//      // create rectangle whose size depends on val scale
//      var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
//      rect.setAttribute('id', 'sampleGrid2');
//      rect.setAttribute('width', relHeight);
//      rect.setAttribute('height', relHeight);
//      rect.setAttribute('fill','white');
//      rect.setAttribute("stroke", "gray")
//      rect.setAttribute("stroke-width", 2);
//
//      // append rectangle
//      document.getElementById('svgMaster').appendChild(rect);

  }
}

function clearScalePattern() {
    // remove scale pattern from svgMaster
    rect = document.getElementById('sampleGrid');
    pat = document.getElementById('gridPat');
    // check if pattern exists
    if (rect) {
        rect.remove();
        pat.remove();
    }
}

