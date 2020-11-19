$(window).load(startingSetup);

var xmlns = "http://www.w3.org/2000/svg";
var confusion;
var svgx = $("#svgMaster").offset().left;
var svgy = $("#svgMaster").offset().top;
var dictionary = Array(); // Label's dictionary!
var usedLabels = Array();
var dictOrdered = Array();
var fullDictionary;
var rectHeight = 14;
var searchTotal = 0;
var totals = 0;
var drawn = false;
numFound = 0;
found = [];

function startingSetup()
{
	dictionaryPrepare();
	document.getElementById("selection").addEventListener("change",updateData);
}

function updateData()
{
	var sign = document.getElementById("selection").value;
	var signNum = parseInt(sign);
	if(typeof(fullDictionary[sign]) == "undefined")
		document.getElementById("name").innerHTML = "?";
	else
		document.getElementById("name").innerHTML = fullDictionary[sign][0];
	document.getElementById("id").innerHTML = sign;
	
	var table = document.getElementById("readings");
	
	// Erase old rows
	while(table.rows.length > 1)
		table.deleteRow(-1);

	var row;
	
	if(typeof(fullDictionary[sign]) != "undefined")
	fullDictionary[sign].forEach(function(element, ind, array){
		if(ind%10 == 0)
			row = table.insertRow(-1);
		
		var cell = row.insertCell(-1);
		cell.innerHTML = element;
	});
	
	table.style.display = "inline-block";
	$.ajax({
		type : "GET",
		url : "matlabInfo.php?infoRequest=signInfo&sign="+sign,
	
		cache : false,
		error : function() {
			console.log("error fetching Info");
			return;
		},
		success : function(result) {
			
			var signInfo = JSON.parse(result);
			document.getElementById("totalExamples").innerHTML =  signInfo.totalExamples;
			document.getElementById("PR").innerHTML = "";
			if(signInfo.pr)
				{
					document.getElementById("PR").innerHTML = "<h3>P/R for all images</h3><img src=\""+signInfo.prFile+"\" width=\"40%\">";
				}
			document.getElementById("trained").innerHTML = signInfo.trainStatus;
			switch(signInfo.trainStatus)
			{
			case "trained":
				document.getElementById("trained").className = "tabCell yes";
				break;
			case "trainable":
				document.getElementById("trained").className = "tabCell almost";
				break;
			case "untrained":
				document.getElementById("trained").className = "tabCell no";
				break;
			}
			
			updateImages(sign);
			confusion = [];
			confusion[sign] = JSON.parse(signInfo.CMdata);
			
			if(confusion[sign] != null)
				document.getElementById("totalCorrect").innerHTML  = confusion[sign][sign];
			
			if(!drawn)
				drawConfusion(sign);
			
			updateConfusion(sign);
		}
	});
	
	

}

function updateImages(sign)
{
	
	//var sign = document.getElementById("selection").value;
	/*document.getElementById("imagesName").innerHTML = sign;
	
	$.ajax({
		type : "GET",
		url : "listExamples.php?sign="+sign,
	
		cache : false,
		error : function() {
			console.log("error fetching the gallery");
			return;
		},
		success : function(result) {
			document.getElementById("images").innerHTML =  result;
		}
	});*/
	
	//clicked = imageClicked;
	$.ajax({
	type : "GET",
	url : "listModelImages.php",
	data : {modelRequest:sign, name:sign},
	// processData: false,
	// contentType: "application/json",
	cache : false,
	error : function() {
		
	},
	success : function(result) {
		document.getElementById('examples').innerHTML = result;
		
	}
});
}

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
			
			fullDictionary = result;
			
			var names = Object.keys(fullDictionary);
			
			for(var i = 0; i< names.length; i++)
				{

					
					fullDictionary[names[i]].forEach(function(element, ind, array)
							{
								array[ind] = unicodize(element);
							});
				}
			
		}
	});
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
		var rep = "832" +number[i];
		str = str.replace("*"+number[i],String.fromCharCode(rep));
	}
	
	str = str.replace(/sz/g,String.fromCharCode(353));
	str = str.replace(/SZ/g,String.fromCharCode(352));
	str = str.replace(/t\./g,String.fromCharCode(7789));
	str = str.replace(/T\./g,String.fromCharCode(7788));
	str = str.replace(/s\./g,String.fromCharCode(7779));
	str = str.replace(/S\./g,String.fromCharCode(7778));
	str = str.replace(/h/g,String.fromCharCode(7723));
	str = str.replace(/H/g,String.fromCharCode(7722));
	
	return str;
}

function drawConfusion(sign)
{
	if(confusion[sign]==null)
		return;
	
	drawn = true;
	searched = Object.keys(confusion).sort();
	found = Object.keys(confusion[searched[0]]).sort();
	if(found[0] == "")
		found = found.splice(1); // there seems to be a "" around
	
	numFound = found.length;
	
	//var total = 0;
	//for (var i=0; i<searched.length; i++)
	//	totals[searched[i]] = 0;
	
	document.getElementById("svgMaster").setAttribute("width", (numFound+5)*rectHeight+5);
	document.getElementById("svgMaster").setAttribute("height", 5*rectHeight+15);

	newRectangle(1,1,(numFound+5)*rectHeight+3,5*rectHeight+13,"confusion1","xx","none");
	
	//for (var i=0; i<searched.length; i++)
	var search = sign;
	var index = searched.indexOf(search);

	
	
	newText(7,10+rectHeight+rectHeight-3,fullDictionary[sign][0],12,false);
	
	newRectangle(5,10+rectHeight,rectHeight*3,rectHeight,"rand","xx","none");
    if(index != -1)
	{

		//total += totals[index]; 
	}
    
	for(var i=1; i<numFound; i++) // found[0] = 000! -> not a sign
		{
		
		var nameSearched = found[i];
		
		
	    if(typeof(fullDictionary[found[i]])!= "undefined")
	    	{
	    		nameSearched = fullDictionary[found[i]][0];
	    	//	search = nameSearched + " ("+found[i]+")";
	    	}
	    
	    
	    newText(53+i*rectHeight,12+rectHeight*2,nameSearched,13,true);
	    

	    
	}
		for(var j=0; j<numFound; j++)
			{
				var color = "none";
				var name = "None searched";
				var find = found[j];
				
				//if(index != -1)
					//{
					//    var percent =  Math.round(confusion[sign][found[j]]/totals * 10000)/100; 
					//    percent = isNaN(percent)?0:percent;
					   /* if(typeof(fullDictionary[found[j]])!= "undefined")
					    	find = unicodize(fullDictionary[found[j]][0]) + " ("+found[j]+")";
					    if(find == "000")
					    	find = "not a sign";
					    name = "Searched: "+search+" Detected: "+find+" ("+percent+"% of "+totals[index]+" )";*/
					//    var hue = Math.round(250 - 250*percent/100);
					//    color = "hsla(" + hue + ",100%,50%,1)";
					//}
				newRectangle(47+j*rectHeight,10+rectHeight,rectHeight,rectHeight,sign,found[j],color);
			}
	
	var text =newText(50+rectHeight*numFound,10+rectHeight+rectHeight-3,0,12,false);
	text.id = "total"; 
	$("rect").on("mouseover", toolTip);
	document.getElementById("tooltip").innerHTML = "Hover over the confusion matrix to see the details";
	//newText(50+rectHeight*numFound,22+rectHeight+20,total.toString(),13,false);
	
}

function updateConfusion(sign)
{
		
	totals = 0;
	var search = sign;
	
	if(confusion[sign] !=null)
	for(var j=0; j<found.length; j++)
		totals += confusion[sign][found[j]];
	else 
		totals = 0;
	
	updateStats(totals, sign, found)
	
	//newText(50+rectHeight*numFound,10+rectHeight+rectHeight-3,totals,12,false);
	if(document.getElementById("total")!= null)
		document.getElementById("total").textContent = totals; 
	document.getElementById("totalDetect").innerHTML = totals;
	
	for(var j=0; j<numFound; j++)
	{
		var color = "none";
		// name = "None searched";
		var find = found[j];
		
		if(confusion[sign] !=null)
			{
			var percent =  Math.round(confusion[sign][found[j]]/totals * 10000)/100; 
			percent = isNaN(percent)?0:percent;
			   /* if(typeof(fullDictionary[found[j]])!= "undefined")
			    	find = unicodize(fullDictionary[found[j]][0]) + " ("+found[j]+")";
			    if(find == "000")
			    	find = "not a sign";
			    name = "Searched: "+search+" Detected: "+find+" ("+percent+"% of "+totals[index]+" )";*/
			var hue = Math.round(250 - 250*percent/100);
			color = "hsla(" + hue + ",100%,50%,1)";
			}else
				color= "white";
		
		rect = document.getElementById(find);
		rect.setAttribute("id",find);
		rect.setAttribute("searched",sign);
		rect.setAttribute("fill",color);
		//newRectangle(47+j*rectHeight,10+rectHeight,rectHeight,rectHeight,sign,found[j],color);
	}


document.getElementById("tooltip").innerHTML = "Hover over the confusion matrix to see the details";
	
}

function newRectangle(x,y,w,h,id,found,fill){
	
	
	var elem = document.createElementNS(xmlns, "rect");
	
	elem.setAttribute("id", found);
	elem.setAttribute("searched", id);
	//elem.setAttribute("total", total);
	elem.setAttribute("x", x);
	elem.setAttribute("y", y);
	elem.setAttribute("width", w);
	elem.setAttribute("height", h);
	elem.setAttribute("stroke", "black");
	
	elem.setAttribute("stroke-width", 0.5);
	elem.setAttribute("fill", fill);
	elem.setAttribute("vector-effect", "non-scaling-stroke");
	document.getElementById("svgMaster").appendChild(elem);
	
}

function newText(x,y,text,size, vertical)
{
	var elem = document.createElementNS(xmlns, "text");
	
	elem.setAttribute("name", "label");
	elem.setAttribute("x", x);
	elem.setAttribute("y", y);
	elem.setAttribute("font-size", size);
	elem.textContent = text;
	if(vertical)
		{
			elem.style.writingMode= "tb";
		}
	document.getElementById("svgMaster").appendChild(elem);
	
	return elem;
}
function toolTip(event)
{
	if(confusion[sign] == null)
		return;
	var sign = $(event.target).attr("searched");
	var found = $(event.target).attr("id");
	//var totals = $(event.target).attr("total");
	if(found == "xx")
		var text = "Hover over the confusion matrix to see the details";
	else
		{
		    var percent =  Math.round(confusion[sign][found]/searchTotal * 10000)/100; 
		    percent = isNaN(percent)?0:percent;
		    if(typeof(fullDictionary[found])!= "undefined")
		    	find = unicodize(fullDictionary[found][0]) + " ("+found+")";
		    else
		    	find = found;
		    if(find == "000")
		    	find = "not a sign";
		    
		    if(typeof(fullDictionary[sign])!= "undefined")
		    	signU = unicodize(fullDictionary[sign][0]) + " ("+sign+")";
		    else
		    	signU = sign;
		    
		    var text = "Searched: "+signU+" Detected: "+find+" ("+percent+"% of "+confusion[sign][found]+" )";
		}
    
	document.getElementById("tooltip").innerHTML = text;
}

function updateStats(totals, sign, found)
{
	if(confusion[sign] == null)
		{
		document.getElementById("mostDetected").innerHTML  = "";
		document.getElementById("secDetection").innerHTML  = "";
		document.getElementById("thirdDetection").innerHTML  = "";
		document.getElementById("imFirst").src ="lib/dummy.jpg";
		document.getElementById("imSecond").src ="lib/dummy.jpg";
		document.getElementById("imThird").src ="lib/dummy.jpg";
		return;
		}
	var best = [totals +1,0,0,0];
	var bestID = ["","",""];
	var bestNr = [0,0,0];
	for(var i=1; i<4; i++)
	{
		for(var j=0; j<found.length; j++)
			{
				
				if(best[i]<confusion[sign][found[j]] && best[i-1] > confusion[sign][found[j]])
					{
					best[i] =confusion[sign][found[j]];
						if(j== 0)
							bestID[i]="No Sign";
						else
							bestID[i] = fullDictionary[found[j]][0];
						
						bestNr[i-1] = found[j];
					}
			}
		if(best[i] == 0)
			bestID[i] = "Not enough Input!";
		
	}
		
		document.getElementById("mostDetected").innerHTML  = bestID[1];
		document.getElementById("secDetection").innerHTML  = bestID[2];
		document.getElementById("thirdDetection").innerHTML  = bestID[3];
		
		$.ajax({
			type : "GET",
			url : "matlabInfo.php?infoRequest=getModelImage&arr[]="+bestNr[0]+"&arr[]="+bestNr[1]+"&arr[]="+bestNr[2],
			//data : {"data":bestNr},
			// processData: false,
			// contentType: "application/json",
			cache : false,
			error : function() {
				
			},
			success : function(result) {
				var data = JSON.parse(result);
				
				document.getElementById("imFirst").src  =  data[0];
				document.getElementById("imSecond").src =data[1];
				document.getElementById("imThird").src =data[2];
			}});
		
}
