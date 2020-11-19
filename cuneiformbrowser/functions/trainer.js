$(window).load(startingSetup);
var verbose = false;
var verboseBuffer = "";
var streamChange = false;
var collectionPages = 0;

var _ESC_ = 27;
var groupsInfo;

function startingSetup()
{
	$(document).on("keydown", reactKeyboard);
	getGroups();
	if(groupID == null)
		document.getElementById("options").style.display ="none";
	if(sel)
		{
		loadGallery(currentPage);
		generatePages();
		ping();
		return;
		}
	if(document.body.contains(document.getElementById('continueButton')))
		{
			$("#continueButton").addClass('statusSelected');
			document.getElementById('continue').style.display = 'block';
		}
	if(document.body.contains(document.getElementById('continueTrainingButton')))
	{
		$("#continueTrainingButton").addClass('statusSelected');
		document.getElementById('continueTraining').style.display = 'block';
	}
	if(document.body.contains(document.getElementById('continueDetectionButton')))
	{
		$("#continueDetectionButton").addClass('statusSelected');
		document.getElementById('continueDetection').style.display = 'block';
	}
	
	
	ping();
	
	
}
function startTraining()
{
    verboseBuffer ="";
	var error = false;
	var errorField = document.getElementById("errorField");
	errorField.innerHTML="";
	
	var userData = document.getElementById('targetNumbers').value;
	var parsedData = userData.split(",");
	var pad = "000";
	
	// read the sign's list
	if(parsedData[0] != "all")
	{
		for(var i =0; i < parsedData.length; i++)
			{
				// Go over the indicated signs: pad them AND check if those are numbers!!
				// For some signs: check if the models are available!
				if(parsedData[i].length>3 || !$.isNumeric(parsedData[i]) )
					{
					error = true;
					var msg = "Invalid number";
					break;
					}
				
				parsedData[i] = (pad+(parsedData[i])).slice(-pad.length);			
			
			}
	
		if(error)
		{
			errorField.innerHTML = msg;
			return;
		}
	}
	else
		parsedData[0] = parsedData[0];
	
	console.log(parsedData);
	
	// read the checkboxes
	annotations = [];
	for (var i=0; i < document.forms[2].length; i++)
		{
			if(document.forms[2][i].checked)
				annotations[i] = {"annotation":document.forms[2][i].id,"collection":document.forms[2][i].value};

		}
	
	console.log(annotations);
	
	retrain = document.getElementById('reTrainFlag').checked ? "1" : "0";
	//retrain = retrain + (document.getElementById('HOG').checked ? "1" : "0");
//	retrain = retrain + (document.getElementById('SIFT').checked ? "1" : "0");
//	retrain = retrain + (document.getElementById('Wedges').checked ? "1" : "0");
//	retrain = retrain + (document.getElementById('MultiClass').checked ? "1" : "0");
	
	// now call php!
	data = {};
	data = {'toTrain': parsedData, 'annotations':annotations, 'target':'none', 'reTrain':retrain};
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
			console.log("Call to server successfull");

		}
	});
	// Show the new dialog
	document.getElementById('matlabOutput').value = "Calling matlab...\n";
	changeDiv('matlabStream');

	// Now call the streaming function in one sec!
	setTimeout('streamMatlab()', 1000);
}

$("#targetNumbers").keypress(function(event){
    if(event.keyCode == 13){
    	event.preventDefault();
    	event.stopPropagation();
        $("#ok").click();
        
    }
	
});


function changeDiv(name)
{
	$(".buttonNormal").removeClass('statusSelected');
	document.getElementById('gallery').style.display = 'none';
	document.getElementById('upload').style.display = 'none';
	document.getElementById('train').style.display = 'none';
	document.getElementById('matlabStream').style.display = 'none';
	
	if(document.body.contains(document.getElementById('continueButton')))
	{
		document.getElementById('continue').style.display = 'none';
	}
	if(document.body.contains(document.getElementById('continueTrainingButton')))
	{
		document.getElementById('continueTraining').style.display = 'none';
	}
	if(document.body.contains(document.getElementById('continueDetectionButton')))
	{
		document.getElementById('continueDetection').style.display = 'none';
	}
	
	document.getElementById(name).style.display = 'block';
	document.getElementById(name+"Button").classList.add('statusSelected');
	document.getElementById("pages").children[currentPage].classList.add('statusSelected');
	setPopUp();
}

function streamMatlab() {
	// this function calls the server and reads matlab's runnign output
	// it will end and set a timeout to itself!
	$.ajax({	type : "GET",
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
						{document.getElementById('matlabOutput').value += result['content'];
						document.getElementById('matlabOutput').value += "Training done!";}
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

function loadBackup()
{
	$.ajax({
		type : "GET",
		url : "matlabInfo.php?infoRequest=prepareBackup",
		dataType : "json",
		async : true,
		cache : false,
		error : function() {
			console.log("error calling for Info!");
			return;
		},
		success : function(result) {
			window.location="editor.php?image="+result['imageID']+"&group="+result['groupID']+"&collection="+result['collectionID']+"&annotation=false&page=0";

		}
	});
	
}
function openDetection()
{
	$.ajax({
		type : "GET",
		url : "matlabInfo.php?infoRequest=processContinue",
		dataType : "json",
		async : true,
		cache : false,
		error : function() {
			console.log("error calling for Info!");
			return;
		},
		success : function(result) {
			// json_encode(array('data'=>$temp['data']));
			// $text = sprintf("DETECTION\n%s\n{\"imageID\":%u,\"group\":%u,\"collection\":%u}\n%s\n%s", 
			// $_SESSION['verboseFile'], $imageID,$_SESSION['group'],$_SESSION['collection'],$algo,$todetect);
			
			window.location="editor.php?image="+result['imageID']+"&group="+result['group']+"&collection="+result['collection']+"&annotation=false";

		}
	});
}
function openTraining()
{
	// Show the new dialog
	document.getElementById('matlabOutput').value = "Calling server...\n";
	changeDiv('matlabStream');
	
	// Re-load all the training info
	$.ajax({
		type : "GET",
		url : "matlabInfo.php?infoRequest=prepareTrainingFeed",
		dataType : "json",
		async : true,
		cache : false,
		error : function() {
			console.log("error calling for Info!");
			return;
		},
		success : function(result) {
			// Now call the streaming function in one sec!
			setTimeout('streamMatlab()', 1000);;

		}
	});

	
	
}

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

// These are the fucntions to be able to have different groups and collections.
//

function getGroups()
{
	$.ajax({
		type : "GET",
		url : "matlabInfo.php?infoRequest=groups",
		dataType : "json",
		cache : false,
		error : function() {
			console.log("error calling for Information");
			return;
		},
		success : function(result) {
			
				groupsInfo = result;
		}
	});
	
}

function groupSelect(button) {
	
	var value = parseInt(button.getAttribute("value")); 
	setPopUp();
	// erase the buttons on the collection popup
	document.getElementById("collectionList").innerHTML = "";
	// now place the buttons
	var htmlClass = '<table>';
	
	for (var i = 0; i<groupsInfo.groups[value].collections.length; i++) // go over all collections in that group
		{
		 var collection = groupsInfo.groups[value].collections[i];
		 htmlClass +="<td><div value="+i+" class=\"buttonNormal\" style=\"margin-top:1em;\" onclick=\"setNewCollection(this);\">"+collection.collectionName+"</div></td>";
		 if((i+1) % 5 == 0)
			 {
			 	htmlClass +=  '</tr><tr>';
			 }
		}
	groupID = value;
	document.getElementById("collectionList").innerHTML = htmlClass;
	setPopUp("popCollection");
	
}

function collectionSelect(){
	setPopUp();
	document.getElementById('gallery').style.display = 'none';
	document.getElementById('upload').style.display = 'none';
	document.getElementById('train').style.display = 'none';
	document.getElementById('matlabStream').style.display = 'none';
	
	// erase the buttons on the collection popup
	document.getElementById("collectionList").innerHTML = "";
	// now place the buttons
	var htmlClass = '<table>';
	
	for (var i = 0; i<groupsInfo.groups[groupID].collections.length; i++) // go over all collections in that group
		{
		 var collection = groupsInfo.groups[groupID].collections[i];
		 htmlClass +="<td><div value="+i+" class=\"buttonNormal\" style=\"margin-top:1em;\" onclick=\"setNewCollection(this);\">"+collection.collectionName+"</div></td>";
		 if((i+1) % 5 == 0)
			 {
			 	htmlClass +=  '</tr><tr>';
			 }
		}
	document.getElementById("collectionList").innerHTML = htmlClass;
	setPopUp("popCollection");
}

function setNewCollection(button)
{
	
	var value = parseInt(button.getAttribute("value")); 
	collectionID = value;
	setPopUp();
	callNewCollection();

}

function callNewCollection()
{
	$.ajax({
		type : "GET",
		url : "matlabInfo.php?infoRequest=setCollection&group="+groupID+"&collection="+collectionID,
	
		cache : false,
		error : function() {
			console.log("error fetching the gallery");
			return;
		},
		success : function(result) {
			
			document.getElementById("groupButton").innerHTML = groupsInfo.groups[groupID].groupName;
			document.getElementById("collectionButton").innerHTML = groupsInfo.groups[groupID].collections[collectionID].collectionName;
			loadGallery(0);
			generatePages();
			
			
			
			$.ajax({
				type : "GET",
				url : "matlabInfo.php?infoRequest=getTrainingAnnotations",
			
				cache : false,
				error : function() {
					console.log("error fetching the Annotations");
					return;
				},
				success : function(result) {
					
					document.getElementById("annotationsForm").innerHTML = result;

				}
			});

		}
	});
	
}

function generatePages(){
	var pagesDiv = document.getElementById("pages");
	
	$.ajax({
		type : "GET",
		url : "matlabInfo.php?infoRequest=collectionPages",
		dataType : "json",
		async : true,
		cache : false,
		error : function() {
			console.log("error calling for Info!");
			return;
		},
		success : function(result) {
			collectionPages = result.pages;
			var divContent = '<div class="helpButton buttonNormal statusSelected" value=0>1</div>';
			for(var i = 1;i<collectionPages; i++)
				{
				var temp = i+1;
				divContent += '<div class="helpButton buttonNormal" value='+i+'>'+temp+'</div>';
				}
			pagesDiv.innerHTML = divContent;

			document.getElementById("options").style.display ="block";

			for(var i = 0;i < pagesDiv.children.length; i++)
				{
					pagesDiv.children[i].addEventListener("click",changePage);
				}
			changeDiv("gallery");
		}
	});
	
	
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
			}

	}
	if (typeof visible == 'undefined')
		visible = false;
}

function select(){
	
	document.getElementById('gallery').style.display = "none";
	document.getElementById('options').style.display = "none";
	document.getElementById('train').style.display = "none";
	setPopUp("popGroup");
}

function cancelSelection(){
	
	if(collectionID != null)
		document.getElementById('options').style.display = "block";
	
	setPopUp();
	
}
//function collectionSelect(button){
//	var value = parseInt(button.getAttribute("value")); 
//	collectionID = value;
//	
//	window.location.href="startxml.php?group="+groupID+"&collection="+collectionID;
//}

function removeImage(imageId)
{

	if(confirm("Are you sure you want to delete this image?\n Any Annotations will be lost!!"))
		{
			console.log("Kill "+imageId);
			data = {};
			data = {'action':'kill',
					'imageId': imageId};
			JSON.stringify(data);
			
			$.ajax({
				type : "POST",
				url : 'matlabInfo.php',
				data : data,
				cache : false,
				success : function(result) {
					if(JSON.parse(result)["error"])
						{
						alert("Error erasing data");
						return;
						}
					window.location.href="start.php?group="+groupID+"&collection="+collectionID+'&selection=true'+'&page='+currentPage;
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
}

function reactKeyboard(event) {

	if (visible) {
		if (event.which == _ESC_) // ESC: close Popup.
		{
			setPopUp();
			return;
		}
	}
	
}

function changePage(){
	
	var value  = this.getAttribute("value");
	if(value == currentPage)
		return;
	// get button with currentPage and erase selected
	
	document.getElementById("pages").children[currentPage].classList.remove('statusSelected');
	//now select the button
	document.getElementById("pages").children[value].classList.add('statusSelected');
	
	currentPage = value;
	// call the gallery
	
	loadGallery(value);
	
	
	
}

function loadGallery(pages){
	
	$.ajax({
		type : "GET",
		url : "loadGallery.php?page="+pages,
	
		cache : false,
		error : function() {
			console.log("error fetching the gallery");
			return;
		},
		success : function(result) {
			document.getElementById("tableContent").innerHTML = result;
		}
	});
	
	currentPage = pages;
	history.pushState({}, "", "start.php?group="+groupID+"&collection="+collectionID+'&selection=true'+'&page='+pages);
}

function popUpNew(type)
{
	setPopUp();
	document.getElementById("errorFieldNew").innerHTML="";
	popUpNew.type = type;
	
	document.getElementById("new").innerHTML = "New "+popUpNew.type;
	document.getElementById("newLong").innerHTML = "New "+popUpNew.type+"'s Name:";
	document.getElementById("newShort").innerHTML = "New "+popUpNew.type+"'s Directory:";
	
	setPopUp("popNew");
	
}

function createNew()
{

	
	var newLong = document.getElementById("long").value;
	var newShort = document.getElementById("short").value;
	var reg = /^[\w ]+$/;
	var test1 = reg.test(newLong);
	var test2 = reg.test(newShort);
	
	if(!test1 || !test2 )
		{
			document.getElementById("errorFieldNew").innerHTML= "Bad Name. Please use only alphanumeric names!";
			return;
		}
	
	setPopUp();
	
	$.ajax({
		type : "GET",
		url :  "matlabInfo.php?infoRequest=setGroup&group="+groupID,
	
		cache : false,
		error : function() {
			console.log("error changing group");
			return;
		},
		success : function() {
			$.ajax({
				type : "GET",
				url :  "matlabInfo.php?infoRequest=new"+popUpNew.type+"&newName="+newLong+"&shortName="+newShort,
			
				cache : false,
				error : function() {
					console.log("error fetching the gallery");
					return;
				},
				success : function(result) {
					console.log(result);
					getGroups();
					if(popUpNew.type=="Group")
						setTimeout(select(),1000);
					else
						{
						collectionID = groupsInfo.groups[groupID].collections.length;
						setTimeout(callNewCollection(),1000);
						}
				}
			});
		}
	});
	

}
////////////////////////

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
