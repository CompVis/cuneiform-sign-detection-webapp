
$(window).load(document.getElementById("dictionary").addEventListener('dblclick',react));

var clicked;
function react(event)
{
	console.log(event.target.getAttribute("colID"));
	
}

function openImagesList(imageClicked)
{	
	
	clicked = imageClicked;
		$.ajax({
		type : "GET",
		url : "listModelImages.php",
		data : {modelRequest:imageClicked.id, name:imageClicked.alt},
		// processData: false,
		// contentType: "application/json",
		cache : false,
		error : function() {
			
		},
		success : function(result) {
			document.getElementById('content').innerHTML = result;
			document.getElementById('modelImages').style.display = "block";
			setTimeout(function(){setPosition($(clicked).position(),"modelImages");}, 0)
			
		}
	});
	
		

}

function openHOGList(imageClicked)
{	
	clicked = imageClicked;
		$.ajax({
		type : "GET",
		url : "listModelImages.php",
		data : {modelRequest:imageClicked.id, name:imageClicked.alt},
		// processData: false,
		// contentType: "application/json",
		cache : false,
		error : function() {
			
		},
		success : function(result) {
			result = result.replace(/.jpg/gi, '_HOG.jpg');
			document.getElementById('content').innerHTML = result;
			document.getElementById('modelImages').style.display = "block";
			setPosition($(clicked).position(),"modelImages");
		}
	});
	
	
	
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
	
	popup.style.left = (newD>0) ? newD : 0;
	popup.style.top = (newT>0) ? newT : 0;
	popup.style.position = "absolute";
	
	
	
}