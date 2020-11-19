/**
 * 
 */

var verbose = false;
var streamChange = false;

/* DEPRECATED
 * 
 * function callPR()
{
	
	$.ajax({
		type : "POST",
		url : "computePerformance.php",
		data : {"action":"PR"},
		// processData: false,
		// contentType: "application/json",
		cache : false,
		error : function() {
			console.log("error calling detection");
			return;
		},
		success : function(result) {
			document.getElementById("computeButton").style.display = "none";

		}
	});
	
// Show the new dialog
document.getElementById('matlabOutput').value = "Calling matlab...\n";
document.getElementById('main').style.display = "none";
document.getElementById('matlabStream').style.display = "block";

// Now call the streaming function in one sec!
setTimeout('streamMatlab()', 1000);
}*/

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
$
		.ajax({
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
					document.getElementById('matlabOutput').value += "Computation done!\nClick ok to close";
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

function closeStream()
{
	document.getElementById('main').style.display = "block";
	document.getElementById('matlabStream').style.display = "none";
}