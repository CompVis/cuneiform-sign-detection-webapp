$(window).load(startingSetup);

function startingSetup()
{
	
	document.getElementById("selection").addEventListener("change",updateImages);
}

function updateImages()
{
	
	var sign = document.getElementById("selection").value;
	document.getElementById("imagesName").innerHTML = sign;
	
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
	});
}