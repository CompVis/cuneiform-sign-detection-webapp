/**
 * Small GUI framework
 * Yeah, I know, there is google CLosure and JQuery and whatnot
 * Just playing around a bit
 **/

// The basic window object

function interfaceWindow(x, y, name)
{
	// position
	this.unitPos = "%";
	this.xpos = x + this.unitPos;
	this.ypos = y + this.unitPos;
	
	this.display = "block";		
	this.cssClass = "signEdit";
	
	this.name = name;

	var div = document.createElement("div");
	var underDiv = document.createElement("form");
	var buttonDiv = document.createElement("div");
	
	div.appendChild(underDiv);
	div.appendChild(buttonDiv);
	
	this.window = div;
	this.content = underDiv;
	this.buttons = buttonDiv;
	
	div.id = this.name;
	
	div.className = this.cssClass;
	
	
	
	div.style.left = this.xpos;
	div.style.top = this.ypos;
	
	div.style.display = this.display;
	div.style["font-family"] =  "arial,sans-serif";
	div.style["z-index"] = 3;
	
	// now put it in there!
	
	document.body.appendChild(div);
	div.style.display = "none";
}

interfaceWindow.prototype.addContent = function()
{
	// call matlabInfo for list of content
	// Yup, this should be separated!
	// generate bullet-point thingie
	
	
	
	// need a handler that should: look up for the selected one, 
	// close this and call the server
	
	this.content.innerHTML = "";
}

interfaceWindow.prototype.addButtons = function(okHandler)
{
	var ok = document.createElement("div");
	var cancel = document.createElement("div");
	
	// Format
	ok.classList.add("button", "statusButton");
	cancel.classList.add("button", "statusButton", "popupButton");
	
	// Text
	ok.innerHTML = "Ok";
	cancel.innerHTML = "Cancel";
	// Event handling -> bind it to object!!!
	
	cancel.addEventListener("click", function(){
		this.hide();
		}.bind(this));
	ok.addEventListener("click", okHandler.bind(this));
	
	this.buttons.appendChild(ok);
	this.buttons.appendChild(cancel);

}

interfaceWindow.prototype.show = function()
{
	this.content.innerHTML = "";	
	$.ajax({
		type : "GET",
		url : "detection_info.php?infoRequest=available_versions",
		dataType : "json",
		context: this,
		success : function(result) {
			//for (var detection in result) {
			for(var i = 0; i < result.length; i++)
				// assume just two data: id and comment
			{
				detection = result[i];
				var radio = makeRadioButton("radioOldDetections", detection[0], detection[0].split('_',1)[0]+" "+detection[1]);
				this.content.appendChild(radio);
				var br = document.createElement("br");
				this.content.appendChild(br);
			}
			//}
		},
		error : function(xhr, status, errorThrown) {
			console.log("Error: " + errorThrown);
			console.log("Status: " + status);
			console.dir(xhr);
		},
		async : true,
		cache : false
	});
	
	this.window.style.display = "block";
}

interfaceWindow.prototype.hide = function()
{
	this.window.style.display = "none";
}

interfaceWindow.prototype.destroy = function()
{
	
}

interfaceWindow.prototype.move = function(x,y)
{
	
}

// from:
// https://stackoverflow.com/questions/23430455/in-html-with-javascript-create-new-radio-button-and-its-text

function makeRadioButton(name, value, text) {

    var label = document.createElement("label");
    var radio = document.createElement("input");
    radio.type = "radio";
    radio.name = name;
    radio.value = value;

    label.appendChild(radio);

    label.appendChild(document.createTextNode(text));
    return label;
  }
