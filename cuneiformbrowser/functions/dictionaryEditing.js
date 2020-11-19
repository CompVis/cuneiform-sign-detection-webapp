
$(window).load(document.getElementById("dictionary").addEventListener('dblclick',react));

var pop = false;
var visible = "";
var dictionary = Array();
var dictOrdered = Array();
var usedLabels = Array();
var nextLabel = null;
var _ENTER_ = 13;
var _ESC_ = 27;
offset = 0;
dictionaryPrepare();
$(document).on("keydown", reactKeyboard);

function react(event)
{
	if(pop)
		return;
	// event.target is the object itself!!!
	var tar = event.target;
	//console.log(event.target.getAttribute("colID"));
	var col = event.target.getAttribute("colID");
	var row = event.target.getAttribute("rowID");
	
	if(tar.name == "image" || tar.cellIndex == 1)
		{
			openImagesList(tar.parentNode.parentNode.id, tar.alt);
			return;
		}
	if(col >=0)
		{
			nextLabel = event.target.parentNode.id;
			openEditor(event.target.parentNode.id);
		}
}

function test(id)
{
	
	
	console.log("test");
}

function openEditor(id)
{
	if(!id.match(/[0-9]+$/))
		{
			return;
		}
	document.getElementById("number").innerHTML = '<b>'+id+'</b>';
	if(typeof(dictionary[id] ) != "undefined")
	{
		document.getElementById("name").value = dictionary[id].name;
		var text = "";
		for(var i = 0; i<dictionary[id].reading.length; i++)
			{
				text += dictionary[id].reading[i] + " ";
			}
		document.getElementById("read").value = text;
	} else
		{
			dictionary[id] = {};
	
			document.getElementById("name").value = "?";
			document.getElementById("read").value = "";
		}
	document.getElementById('editName').style.display = "block";
	pop = true;
	visible = "editName";
	var target = document.getElementById(id);
	setPosition(target.getBoundingClientRect(),'editName');
}
function openImagesList(id, alt)
{	
	nextLabel = id;
		$.ajax({
		type : "GET",
		url : "listModelImages.php",
		data : {modelRequest:id, name:alt},
		// processData: false,
		// contentType: "application/json",
		cache : false,
		error : function() {
			
		},
		success : function(result) {
			document.getElementById('content').innerHTML = result;
			setPosition(document.getElementById(id).getBoundingClientRect(),'editName');
		}
	});
	
	document.getElementById('modelImages').style.display = "block";
	pop =true;
	visible = "modelImages";
}

function dictionaryPrepare()
{
	$.ajax({
		type : "GET",
		url : "matlabInfo.php?infoRequest=dictionary",
		dataType : "json",
		cache : false,
		processData: false,
		error : function() {
			console.log("error calling for startup Info!");
			return;
		},
		success : function(result) {
			
			// now flip this thing!!!
			dictionary = {};
			
			for(var id in result)
				{
				if(result.hasOwnProperty(id)){
					var newId = ("000" + (id)).slice(-3);
					dictOrdered[newId] = result[id][0];

					dictionary[id] = {"name":result[id][0], "reading":result[id]};
//					for(var i = 0; i< result[id].length;i++)
//						 {
//							dictionary[id][reading][i] = result[id][i];
////							var newId = ("000" + (id)).slice(-3);
////							dictionary[result[id][i].toLowerCase()] = newId;  // store the dictionary!
//						 }}
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
	}});
}

function unicodize(str)
{
	var number = Array('0','1','2','3','4','5','6','7','8','9');
	
	for(var i = 0; i<10;i++)
		{ 
			str = str.replace(number[i],"*"+number[i]);
		}
	for(var i = 0; i<10;i++)
	{ 
		str = str.replace("*"+number[i],"&#832"+number[i]);
	}
	
	str = str.replace(/sz/g,"š");
	str = str.replace(/SZ/g,"&#352");
	str = str.replace(/t,/g,"&#7789");
	str = str.replace(/T,/g,"&#7788");
	str = str.replace(/s,/g,"&#7779");
	str = str.replace(/S,/g,"&#7778");
	str = str.replace(/h/g,"&#7723");
	str = str.replace(/H/g,"&#7722");
	str = str.replace(/s'/g,"ś");
	str = str.replace(/S'/g,"Ś");
	str = str.replace(/'/g,"ʾ");
	
	return str;
}

function update()
{
	var currentRow = document.getElementById(nextLabel);
	var values = currentRow.cells.length;
	var newName = document.getElementById("name").value;
	if(!newName.trim().match(/[0-9a-zA-Z,':]+$/))
		{
			document.getElementById("error").innerHTML = "Non alpha-numeric input!";
			document.getElementById("error").style.display = block;
			return;
		}
	if(dictionary[nextLabel].name != newName)
		{
			currentRow.cells[2].innerHTML = unicodize(newName);
			currentRow.cells[3].innerHTML = unicodize(document.getElementById("name").value);
			dictionary[nextLabel].name = newName;
			dictionary[nextLabel].reading = Array();
			dictionary[nextLabel].reading[0] = document.getElementById("name").value;
		}
	var newReadings = document.getElementById("read").value;

	newReadings = newReadings.split(" ");
	var dictset = new Set();
	dictset.add(newName.toLowerCase());
	for(var i=0; i<newReadings.length; i++)
		{
			if(newReadings[i] != "")
				{
					if(!newReadings[i].trim().match(/[0-9a-zA-Z,':]+$/) && !/[^\u0000-\u00ff]/.test(newReadings[i].trim()))
					{
						document.getElementById("error").innerHTML = "Non alpha-numeric input!";
						document.getElementById("error").style.display = block;
						return;
					}
					
					dictset.add(newReadings[i].toLowerCase());
}
}
	//dictionary[nextLabel].reading = Array();
	offset = 0;
	dictionary[nextLabel].reading = Array();
	dictset.forEach(function(value1, value2, set){
		
		dictionary[nextLabel].reading[offset] = value1;	offset +=1}); // to avoid duplicates
	
	
    currentRow.cells[2].innerHTML.innerHTML = "";

// trim the table

	for(var i= 3; i < values;i++ )
		{
			currentRow.cells[i].innerHTML = "";
			//dictionary[nextLabel].reading.pop();
		}
    var offset = 0;
    currentRow.cells[3].innerHTML = dictionary[nextLabel].reading[0];
	for(var i=0; i< dictionary[nextLabel].reading.length; i++)
		{
			temp = dictionary[nextLabel].reading[i];
    
            if( /[^\u0000-\u00ff]/.test(temp))
            {
                currentRow.cells[2].innerHTML = temp;
                offset = 1;
                continue;
            }

			if(i+3>=values)
				{
				var newCell = currentRow.insertCell(-1);			
                newCell.innerHTML = unicodize(temp);
				}
			else
				currentRow.cells[i-offset+4].innerHTML = unicodize(temp);
		}
	
	// Store the data:
	data = {};
	data = {"id": nextLabel, "label": dictionary[nextLabel].reading };
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
	

	
	//change span for "readings"
	var maxspan = 0;
	var tableRows = document.getElementById("dictionary").children[0].children; 
	for(var  i = 1; i<tableRows.length;i++)
		if(tableRows[i].cells.length > maxspan)
			maxspan = tableRows[i].cells.length;
	
	
	var span = parseInt(document.getElementById("header").getAttribute("colspan"));
	span =  span + (maxspan-3-span);
	document.getElementById("header").setAttribute("colspan",span);
	document.getElementById('editName').style.display = "none";
	pop = false;
	
	
}

function newEntry()
{
	var newSign = document.getElementById("new").value;
	var newSign = ("000" + (newSign)).slice(-3);

	if(newSign.match(/[0-9a-zA-Z\.]+$/) != null && newSign != "000")
	{
		if(document.getElementById(newSign) == null)
			{
		
				var number = parseInt(newSign);
				var table = document.getElementById("dictionary");
				var tableRows = document.getElementById("dictionary").children[0].children;
				var destination = 1;
				for(var i= tableRows.length-1; i>0; i--)
					{
						if(parseInt(tableRows[i].id)>number)
							{
								destination = i;								
							}
					}
				var newRow = table.insertRow(destination);
				newRow.setAttribute("id",newSign);
				var cell = newRow.insertCell(-1);
				cell.innerHTML = newSign;
				cell.setAttribute("class","noModel");
				for (var i=0; i<3; i++)  // three empty cells: Image, Name, First reading
				{
					var cell = newRow.insertCell(-1);
					cell.innerHTML = "?";
				}
				
			}
		nextLabel = newSign;
		openEditor(newSign);
	}
}


function reactKeyboard(event) {

	if (pop) {
		if (event.which == _ESC_)
			{
			document.getElementById(visible).style.display = "none";
			pop = false;
			return;
			}
		if(event.which == _ENTER_ )
			{
				if(visible == "editName")
					{			
						update();
						return;
					}
				document.getElementById(visible).style.display = "none";
				pop = false;
				return;
			}
	}else
		if(event.which == _ENTER_)
		{
		 newEntry();
		}
	
}

function setPosition(position, id)
{
	var popup = document.getElementById(id);
	var h = popup.offsetHeight;
	var w = popup.offsetWidth
	h = $('#'+id).height();
	w = $('#'+id).width();
	var newD = Math.round(position.left-w/2)
	var newT = Math.round(position.top- h);
	
	window.scrollTo(0,newT-100);
	popup.style.left = (newD>0) ? newD : 0;
	popup.style.top = (newT>0) ? newT : 0;
	popup.style.position = "absolute";
	
	
	
}
