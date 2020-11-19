<?php if(session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}
	// Call session manager and check if a user is logged in
	//include('sessionManagement.php');
	// Config files
	include_once('config.php');
	// Set up the Editor and prepare the html functions. Here the $_SESSION['cuneidemo'] variabels are set.
	include_once('editorBuild.php');

?>
<html>
<head>
<link rel="stylesheet" type="text/css" href="styleEditor.css">
<meta http-equiv="content-type" content="text/html; charset=utf-8">
<title>Loading...</title>

<script src="lib/jquery.min.js"></script>
</head>
<body>
<div class="container">
<div id="overlay" onclick=""></div>
<div class="menu" style="cursor:default;">
<p id="tabletName"><b> Loading... </b></p>
<div id="totals" class="small">Boxes: 0/0</div>
<div class="signInfo">
<p style="text-align: center;">Sign's Information </p>
<div class="numberArea" id="number">00</div>
<div id="nameArea" class="numberArea nameArea"> AN
    </div>
<div id="confidenceArea" style="display:none;"> <div class="confidenceArea" id="signConfidence" >00</div></div>
</div>

<input type=range min=0 max=1 value=0 id="slider" step=".01" oninput="confidenceUpdate(this.value)" disabled="true" autocomplete="off" style="display: none;" >
<div id="sliderPosition" style="display: none;">0</div>
<hr>
Zoom
<select name="zoom" id="zoom" onchange='resizeEverything(this.value);' autocomplete="off">
  <option value="150">150%</option>
  <option value="100">100%</option>
  <option value="75">75%</option>
  <option value="50">50%</option>
  <option value="25">25%</option>
  <option value="10">10%</option>
</select>
<hr>
<form>
<div id="online">
	<div><div style="float:left;margin-left:2em;">Server Services</div> <div class="button helpButton" onclick='setPopUp("popServerServices");'>?</div></div><br />
	<div class="button" id="detect" onclick=' setPopUp("popDetect");' >Detect</div> <!-- onclick=' setPopUp("popDetect");' -->
	<div class="button" id="load" onclick="loadAnnotations();">Load Annotations</div>
	<!-- <div class="button" id="upload" >Upload Annotations</div> -->
	<div class="button disabled" id="saveServer" onclick="saveAnnotationsServer('noArchive');">Save Annotations</div>
	<!-- <div class="button" id="archiveServer" onclick="saveAnnotationsServer('archive');" style="display:none">Archive</div> -->
	<div class="button" id="sendCorrections" onclick="saveAnnotationsServer('noArchive', true);" style="display:none">Save as Annotation</div>
	<div class="button" id="saveCorrections" onclick="saveCorrections();" style="display:none">Continue Later</div>
	<div class="button" id="reTrain" onclick="prepareRetrain();" style="display:none">Re-train</div>
	<div class="button" id="backStart" >Back to Index</div>
	<div class="button" id="clear" style="display: none;" onclick="clearAnnotations();">Clear Annotations</div>
	<div class="button" id="reload" style="display: none;" onclick="reloadAnnotations();">Reload Annotations</div>
	<div class="button" id="lastResult" style="display: block;" onclick="loadResults('');">Load latest Result</div>
	<div class="button" id="lastResultOld" style="display: block;" onclick="oldDetectionsWindow.show();">Load old Results</div>
    <div class="button" id="acceptAll" style="display: none;" onclick="acceptAllCorrections();">Accept all Results</div>
	<div class="button" id="cleanUp" style="display: none;" onclick="cleanUp();">Clean-up Results</div>
	<div class="button" id="loadBackup" style="display: none;" onclick="restoreBackup()">Continue Feedback</div>

	<div id="backup" style="display: none;">
	<select name="backupSelect" id="backupSelect" onchange='reloadAnnotations(this.value);' autocomplete="off">
	  <option value="0">Newest Annotation</option>
	</select>
	</div>
	<hr>

</div>
<!-- <div><div style="float:left;margin-left:2em;">Local Functions</div> <div class="button helpButton" onclick='setPopUp("popLocalServices");'>?</div></div><br />
<div class="button" onclick="localImage('start')" style="display: none;" id="localImage">Load Image</div>
<div class="button" onclick="localAnnotation('start')" id="loadLocal">Load Locally</div>
<div class="button" id="clearOff" style="display: none;" onclick="clearAnnotations();">Clear Annotations</div>
<div class="button" id="saveLocal" onclick="downloadXML();">Save Locally</div>-->
</form></div>
<div class="infoPanel infoHelp" id="helpPanel" style="height:8.5em; cursor:default;">
<div id="infoEdit" style="display: none"> <br /> <b>Click</b> a Box to select<br />
<i><b>Click</b> and <b>Drag</b></i> to move
</div>
<div id="infoProtected">
<br /> <b>Click</b> a Box to select<br />
Press <b>ESC</b> to deselect<br />
Press <b>TAB</b> to change box
Press <b>ENTER</b> to see details
</div>
<div id="infoDefault" style="display: none">
<i><b>Click</b> and <b>Drag</b></i> to move<br />
 <b>Click</b> a Box to select:<br />
Press <b>E</b> to resize the box<br />
Press <b>ENTER</b> to relabel<br />
Press <b>DEL</b> to erase<br />
Press <b>ESC</b> to deselect<br />
Press <b>TAB</b> to change box</div>

<div id="infoRelabel" style="display: none">
<br /> <b>Click</b> a Box to relabel<br />
Press <b>ESC</b> to deselect<br />
<b>Click</b> on image to deselect
</div>
<div id="infoTrain" style="display: none">
<br /> <b>Click</b> a Box to select<br />
Change confidence threshhold moving the slider<br />
Press <b>ENTER</b> to see details<br />
</div>
<div id="infoFeedback" style="display: none">
<br /> <b>Click</b> a Box to select<br />
Change confidence threshhold moving the slider<br />
Press <b>ENTER</b> to give feedback<br />
</div>
<div id="infoNewBoxes" style="display: none">
<div class="small" style="text-align: center;"><br />Start on upper-right corner!</div>
<b>Click</b> to draw new Box <br />
<b>ESC</b> to cancel drawing <br />
<b>Click</b> to end drawing<br />
<b style="color:red;">NOT</b> Click&Drag!!!
</div>
</div>
<div class="infoPanel" style="cursor:default;">
	Signs' Color Code
	<br />

	<div id="statusfeld" style="width:10em;margin-left:0.5em;">
		<div style="float:left; width:1em;margin-top:0.05em">
			<div class="smallbox" id="annotationColor"></div>
			<div class="smallbox" id="nonAnnotationColor"></div>
			<div class="smallbox" id="selectedColor"></div>
			<div class="smallbox" id="sameColor"></div>
		</div>
		<div  style="text-align:left;float:left; margin-left:0.5em;">
			Annotated<br />
			 Not Annotated<br />
			 Selected<br />
			 Same Value<br />
		</div>
	</div>
<!--  		<div id="statusfeld" style="text-align:left;"> -->
<!-- 		Annotated<div class="smallbox" id="annotationColor"></div><br /> -->
<!-- 		 Not Annotated<div class="smallbox" id="nonAnnotationColor"></div><br /> -->
<!-- 		 Selected<div class="smallbox" id="selectedColor"></div><br /> -->
<!-- 		 Same Value<div class="smallbox" id="sameColor"></div><br /> -->
<!-- 		</div> -->
	<div id="infoDetect" style="margin-left:0.5em; display: none;">
		<div style="float:left; width:1em;margin-top:0.05em">
		 <div class="smallbox" style="background-color: hsla(0,100%,50%,1)"></div>
		 <div class="smallbox" style="background-color: hsla(25,100%,50%,1)"></div>
		 <div class="smallbox" style="background-color: hsla(50,100%,50%,1)"></div>
		 <div class="smallbox" style="background-color: hsla(75,100%,50%,1)"></div>
		 <div class="smallbox" style="background-color: hsla(100,100%,50%,1)"></div>
		</div>
		<div  style="text-align:right;float:right; margin-left:0.5em; margin-right:1.5em; width:9em;">
		 0% confidence<br />
		 25% confidence<br />
		 50% confidence<br />
		 75% confidence<br />
		 100% confidence<br />
		</div>
	</div>

	<div id="infoCorrect" style="margin-left:0.5em; display:none;">
		<div style="float:left; width:1em;margin-top:0.05em">
			<div class="smallbox" id="blue" style="background-color:blue"></div>
			<div class="smallbox" id="blue" style="background-color:white"></div>
			<div class="smallbox" id="green" style="background-color:green"></div>
			<div class="smallbox" id="red" style="background-color:red"></div>
			<div class="smallbox" id="orange" style="background-color:orange"></div>
		</div>
		<div  style="text-align:left;float:left; margin-left:0.5em;">
			Not Reviewed<br />
			Reviewed as:<br />
			 Correct<br />
			 Not a Sign (Fp)<br />
			 Incorrect Sign<br />
		</div>
	</div>
</div>

<div class="nonMax" id="nonMaxBox" style="cursor:default;">
Non-Maximum Suppression<br />
<input type=range min=0 max=1 value=0.5 id="nonmax" step=".01" oninput="maximumSuppression(this.value)"  autocomplete="off" style="display: block;" >
<div id="sliderNonMax" style="display: block;">0.5</div>
</div>
<div>
	<div class="statusBar">
		<div class="statusFlag mode" id="mode" onClick="switchModes();"><b>Box</b> Mode</div>
		<div class="statusBuffer" id="buffer1"></div>
		<div class="statusBuffer" id="buffer2"></div>
		<div class="button statusButton" onClick="annotate();" style="float:left; margin-left:1em;" id="statusAnnotate">New Boxes</div>
		<!-- <div class="button statusButton" id="statusEdit" onClick="relabel()" style="float:left; margin-left: 3px;">Relabel</div> -->
		<div class="button statusButton" id="statusCorrect" onClick="correctMode()" style="float:left; margin-left: 3px; display:none;">Corrections</div>
		<div class="button statusButton" id="statusDefault" onClick="defaultMode()" style="float:left; margin-left: 3px;">Edit Boxes</div>
		<div class="button statusButton" id="statusProtected" onClick="noEditMode()" style="float:left; margin-left: 3px;">Protected</div>

		<a href="logout.php"><div class="logout" title="logout"></div></a>
		<div class="smallbox" id="ping" style="background-color:green; float:right; transform: translateY(-50%); position:relative; top:50%;right:0.5em;"></div>
		<div class="button statusButton" onclick='setPopUp("popUpHelp");' style="float:right; margin-right:1em;">Help</div>
		<!--  <div class="button statusButton" onclick='setPopUp("popShortcut");' style="float:right; margin-right:3px;">Shortcuts</div> -->
		<div class="statusFlag" id="statusSave">Saved</div>

	</div>
		<svg id='containerSVG' width=0 height=0  class="content">
		   <g id="svgMaster">
			 <image xlink:href="dummy.jpg" draggable="true" x=0 y=0 height=0 width=0 id="image"></image>
			 <g id="boxes_group"></g>
			 <g id="lines_group" style="display:none;"></g>
			</g>
		 </svg>
</div>

</div>
<div id="tooltip" class="tooltip"></div>
<div id="popUpHelp" class="hoverInfo" style="text-align:center;">
<div id="popuptext" class="popText">
<h3 style="text-align:center;">General Help</h3>
To close any window, click "ok"/"cancel" or press ESC <br />
<br />
<div id="generalHelp">
When in editing mode, there are 4 main submodes you can select the editor to be:<br /><br />
<div class="center"><div class="button statusButton">New Boxes</div><div class="button statusButton">Relabel</div><div class="button statusButton">Edit Boxes</div><div class="button statusButton">Protected</div></div>
<br/>
<div class="center"><div class="button statusButton statusSelected">Protected</div></div>
A protected mode: you can select bounding boxes but aren't allowed to edit, delete or resize them.<br />
Clicking on a bounding box will select it, showing you the ones with the same label.<br />
When selected, you can take a closer look at the bounding box by pressing <b>ENTER</b>.<br />
This is the default mode for image with <i>archived</i> annotations. <br />
Pressing ESC or clicking anywhere on the picture will deselect the box, TAB will select the next box.
<br />
<div class="center"><div class="button statusButton statusSelected">Edit Boxes</div></div>
This is the default mode for images with non-archived annotations.<br />
In this mode, you can edit any aspect of the bounding boxes.<br />
Clicking on a bounding box will select it, showing you the boxes with the same label in blue.<br />
When selected, you can change the labeling, position and size of the box.<br /> You can also delete them while selected (press <b>DEL</b>)<br />
Pressing ESC or clicking anywhere on the picture will deselect the box, TAB will select the next box.
<br />

<div class="center"><div class="button statusButton statusSelected">New Boxes</div></div>
Enables you to add new bounding boxes to the image.<br /> Click where you want the boxe's upper left corner to be and then click
again for the bottom right corner. Cancel the drawing clicking ESC.<br />
When done, a pop up window will prompt you for the sign's ID. <br />

<br />
<div class="center"><div class="button statusButton statusSelected">Hot Keys</div></div>
* (Numeric Pad): Show labels (Box mode only, function: showLabels() )<br />
+ : Show meta-data <br />
L : Change edit mode (Line/Box) <br />
</div>
<div id="trainHelp" style="display:none;">

After performing a detection (or loading a saved detection) you will be in <i>training mode</i>.<br />
One important difference with the editing mode is the small slider underneath the "Sign
s information Box": detected signs have a normed <i>confidence</i> (how sure a detection is) and moving the slider you can set the threshold for the results to be shown.
Only the detections with a higher confidence than the threshold will be shown.<br/>
Only two main options are available during training:<br/>
<div class="center"><div class="button statusButton">Corrections</div><div class="button statusButton">Protected</div></div>
<br/>
<div class="center"><div class="button statusButton statusSelected">Protected</div></div>
A protected mode: you can select bounding boxes but aren't allowed to edit, delete or resize them.<br />
Clicking on a bounding box will select it, showing you the ones with the same label.<br />
When selected, you can take a closer look at the bounding box by pressing <b>ENTER</b>.<br />
Pressing ESC or clicking anywhere on the picture will deselect the box, TAB will select the next box.
<br />
<div class="center"><div class="button statusButton statusSelected">Corrections</div></div>
Here you can correct the detections before sending the feedback for re-training.<br />
When you select a box, a small window will pop up showing you the content of the box and enabling you to review the detection: <br />
You can accept the detection, correct it when the wrong sign was detected or just signal that the detection is not a sign at all.<br/>
<b>Important</b>: only the boundign boxes shown on the screen <i>that have been reviewed</i> will be sent as feedback!!<br/>
</div>
<div class="small">For more help, click the "?" buttons</div><br />
<!-- <b>Detect</b>: try to detect the cuneiform signs<br /> -->
<!-- <b>Load Annotations</b>: load the tablet's annotation from the server <br /> -->
<!-- <b>Upload Annotation</b>: upload an annotation file to the server <br /> -->
<!-- <b>Save Annotations</b>: save the current annotation on the server <br /> -->
<!-- <b>Back to Index</b>: go back to the entry page <br /> -->
<!-- <b>Load Locally</b>: TODO <br /> -->
<!-- <b>Save Annotations</b>: download the annotations' file <br /> -->
<!-- <h4>Color code</h4> -->
<!--   - Annotated Sign<div class="smallbox" id="annotationColor"></div><br /> -->
<!--   - Non-Annotated Sign<div class="smallbox" id="nonAnnotationColor"></div><br /> -->
<!--  - Selected Sign<div class="smallbox" id="selectedColor"></div><br /> -->
<!--  - Same signs as selected one<div class="smallbox" id="sameColor"></div><br /> -->
<!-- <br /> -->
</div>
<div class="button statusButton popupButton" onclick="setPopUp();">Ok</div></div>

<div id="loadAnnotation" class="hoverInfo" >
<div id="popuptext" class="popText">
Please choose an xml annotation file to open <br />
<form id="fileField"><input type="file" id="annotationFile"></form>
<br />
<div class="button statusButton" onclick="localAnnotation('load');">Load File</div>
<div class="button statusButton" onclick="localAnnotation('cancel');">Cancel</div>
<div id="error"></div>
</div>
</div>

<div id="loadImage" class="hoverInfo" >
<div id="popuptext" class="popText">
Please choose an imagen file to open <br />
<form id="fileField"><input type="file" id="imageFile"></form>
<br />
<div class="button statusButton" onclick="localImage('load');">Load File</div>
<div class="button statusButton" onclick="localImage('cancel');">Cancel</div>
<div id="error"></div>
</div>
</div>


<div class="signEdit" id="signEdit">
Edit Information<br />
<svg id="svgThumb" width="50px" height="30px" style="border: 1px; solid #000000;">
	<image xlink:href="dummy.jpg" draggable="true" x="0" y="0" height="0" width="0" id="thumb">
	</svg>
</svg>
<form autocomplete="off"><input type="text" id="numberEdit" value=""></form>
<div id="editHumanReadable" style="text-align:center;"></div>
<form id="SignConservationState">
	<p>Sign's conservation state:</p>
	<div>
		<input type="radio" id="conservation1" name="conservation" value="intact" checked>
		<label for="conservation1">Intact</label>
		<input type="radio" id="conservation2" name="conservation" value="partial">
		<label for="conservation2">Partially broken</label>
		<input type="radio" id="conservation3" name="conservation" value="broken">
		<label for="conservation3">Broken</label>
	</div>
</form>
<div id="editWarning" style="color:red; text-align:center; display:none;"></div>
<!-- <div id="nameArea" class="numberArea nameArea"> AN</div> -->
<div id="HOGandModel" style="display:none;">
<form action="" id="trainCheckboxes"  style="display:none;">
<input type="checkbox" name="correct" id="wrongSign"  onclick="toggleTrainCheckBoxes(this);">Wrong Sign
<input type="checkbox" name="correct" id="noSign" onclick="toggleTrainCheckBoxes(this);">Not a Sign</form>
<div>Confidence:<div id="showConfidence"></div><br /></div>
<!-- <div style="float:left;border: 1px solid #A1A1A1; border-radius:3px;margin-right:2em;padding:0.5em; margin-top:5px;">Closest Model <br />
 	<svg id="svgModel" width="50px" height="64px" style="border: 1px solid #000000; ">
 		<image xlink:href="results/TEST2.jpg" draggable="true" x="0" y="0" height="64" width="6800" id="model" title="4">
	</svg>
</div>
<div style="float:right;border: 1px solid #A1A1A1; border-radius:3px;;padding:0.5em; margin-top:5px;"> HOG influence <br />
	 <svg id="svgHOG" width="50px" height="64px" style="border: 1px solid #000000;">
	 	<image xlink:href="results/TESTHOG.jpg" draggable="true" x="0" y="0" height="64" width="6800" id="hog" title="4">
	</svg> -->

</div>

<div class="button statusButton" onclick="openDictionary();">Dictionary</div><br/ >
<div class="button statusButton popupButton" onclick="storeSignInfo()" id="okButtonSave">Save</div>
<div class="button statusButton popupButton" onclick="setPopUp();signEditing= false;">Cancel</div></div>
</div>
<div class="signEdit popUp" id="popShortcut">
<div class="popText">
<h3 style="text-align:center;">Shortcuts</h3>
h - Open the main help pop-up <br />
n - Start the "new Boxes" mode<br />
e - resize box (only if selected and allowed)<br />
ESC - deselect / close window<br />
</div>
<div class="button statusButton popupButton" onclick="setPopUp();">Ok</div>
</div>
<div id="popServerServices" class="hoverInfo" style="text-align:center; left: 250px; width:32em;">
	<div class="popText">
		<h3 style="text-align:center;">Server Services</h3>
		<div class="small">Note: buttons appear and are clickable only in context! <br/></div><br />

				<div class="helpStart">
						<div class="center"><div class="button">Detect</div></div>
						Open the detection function window. When the detection program is run, the results are displayed color-coded
						according to the detector's confidence <br/>
						Note that this will open the training mode<br/><br />
				</div>
				<div class="helpStart">
						<div class="center"><div class="button">Load Annotations</div></div>
						Loads the image's annotations from the server<br /><br />
				</div>
				<div class="editpossible">
						<div class="center"><div class="button">Save Annotations</div></div>
						Saves the current annotations on the server. Old versions are backed up<br /><br />
				</div>
				<div class="helpTraining">
						<div class="center"><div class="button">Quit Training</div></div>
						Clear results and leave training mode.<br />
						<!-- No feedback is sent to the server!<br /><br /> -->
				</div>
				<div class="helpTraining">
						<div class="center"><div class="button">Clean-up Results</div></div>
						Filter detections with non-maximum suppression of 0.5 and minimum confidence of 0.3.<br /><br />
				</div>

				<div class="helpAnnotate">
						<div class="center"><div class="button">Clear Annotations</div></div>
						Erase all annotations on the image<br /><br />
				</div>
				<div>

				<div class="center"><div class="button">Back to Index</div></div>
						Closes the editor and opens the images' index.<br />
						<b>Nothing</b> is saved!<br /><br />
				</div>
				<div class="helpStart">
						<div class="center"><div class="button">Load latest Results</div></div>
						Loads the image's latest detection results from the server<br />
						Note that this will open the training mode<br/><br />
				</div>
				<div class="helpStart">
						<div class="center"><div class="button">Load old Results</div></div>
						Opens small window with list of all available detection results for this image. After
						confirming a selection, loads the selected detection results from the server<br />
						Note that this will open the training mode<br/><br />
				</div>
				<div class="helpAnnotate">
						<div class="center"><div class="button">Reload Annotations</div></div>
						Reload the last saved annotation's version<br /><br />
				</div>
				<div class="editpossible">
					<div class="center">
					<select autocomplete="off">
 						 <option value="0">Newest Annotation</option>
					</select></div>
					<br /> Select the annotations' version you want to edit<br /> (only if not archived)
				</div>
				<div>

		</div>
	<div class="button statusButton popupButton" onclick="setPopUp();">Ok</div>
</div>
</div>

<div id="popLocalServices" class="hoverInfo" style="text-align:center; left: 250px; width:25em;">
	<div class="popText">
		<h3 style="text-align:center;">Local Services</h3>
		<div class="center"><div class="button statusButton">Load Locally</div></div><br />
		Load an annotations file from your computer<br />
		<div class="small">Note: the annotations are <b>not</b> saved on the server automatically</div><br />
		<div class="center"><div class="button statusButton">Save Locally</div></div><br />
		Save the annotations on your computer<br />
		A pop-up window will appear enabling you to download the current annotation (or detection) in XML format.<br />
	</div>
	<div class="button statusButton popupButton" onclick="setPopUp();">Ok</div>
</div>

<div id="popSaveLocally" class="hoverInfo" style="text-align:center; left: 20%px; top:25%; width:25em;">
	<div class="popText">
		<h3 style="text-align:center;">Save annotations' XML-file locally</h3>

		<b>Firefox/Chrome</b><br />
		Click on the link <br /><br />
		<b>Other browsers</b><br />
		Right-Click on the link and select "Save as..." <br /><br />
		<a download="info.txt" id="downloadlink" style="display: none;text-align:center;" onclick="">Download annotations</a>
	</div>
	<div class="button statusButton popupButton" onclick="setPopUp();">Ok</div>
</div>

<div id="popDetectOld" class="hoverInfo" style="text-align:center; left: 20%px; top:25%; width:21em;">
	<div class="popText">
		<h3 style="text-align:center;">Detect Signs</h3>
		<div style="text-align:center;">
			<div class="button statusButton statusSelected" id="detectAll" onclick="showDetectAll();">All Signs</div>
			<div class="button statusButton" id="detectSingular" onclick="showDetectSpecific();" style="width: 7em; ">Specific Signs</div>
		</div>

		<div style="border-radius: 5px; border: 1px solid #000000; vertical-align: middle; margin-top: 3px;padding:3px;">
		<b>Options</b><br />
		<form>
		<div >
		  <input type="checkbox" id="prior"> Prior <input type="checkbox" id="ngram"> n-gram<div style="display:none;"><input type="checkbox" id="multi"> Multi-Class <input type="checkbox" id="SIFT"> SIFT <br />
		 <input type="checkbox" id="consensus" checked> Consensus
	 	<input type="checkbox" id="edge"> Edge Representation </div></div>
		 <div id="options" style="text-align:center;"><select id="imageOptions" autocomplete="off" onchange="refreshInfo();" name="imageOptions" >
		 <option value="defaultOptions">Default options</option>
		 </select></div>
		 <div style="text-align:right">Fast Search<input type="checkbox" id="fast"></div>
		</form>
		<div id="errorField2" style="color:red; text-align:center;"></div>
		</div>
		<div id="specificInput" style="border-radius: 5px; border: 1px solid #000000; vertical-align: middle; display:none; margin-top: 3px; padding:3px;">
		<form>
		 Detect the following signs: <br />
		 <input type="text" id="selectedSign" name="todetect" autocomplete="off" size="20" value="" style="width:22ch; margin:5px;"> <div class="button statusButton" id="chooseSign" onclick="showModelList();" style="width: 6em; text-align:center;">List Available</div>
		 <div class="small">Enter the signs' numbers or text labels separated by commas</div>
		 <div id="errorField" style="color:red; text-align:center;"></div>
		</form>

		</div>
	</div>

	<div class="button statusButton popupButton" onclick="startDetection();">Detect!</div>
	<div class="button statusButton popupButton" onclick="setPopUp();errorField.innerHTML='';">Cancel</div>
</div>


<div id="popDetect" class="hoverInfo" style="text-align:center; left: 20%px; top:25%; width:21em;">
	<div class="popText">
		<h3 style="text-align:center;">Detect Signs</h3>
		<div style="border-radius: 5px; border: 1px solid #000000; vertical-align: middle; margin-top: 3px;padding:3px;">
		<b>Options</b><br />
		<form>
		<div>Tablet Scaling</div>
		<div class="small">Move the slider to select an appropriate input scale. A blue help grid appears on slider movement. For the best results the distance between two blue lines should approximately match the sign height of the script.</div>
		<div><input type="range" id="scale_slider" name="tab_scale" min="0" max="5" value="1.0" step="0.25" oninput="updateTextInput(this.value, 'scale_val');">
		     <input type="number" id="scale_val" min="0" max="5" value="1.0" step="0.25" oninput="updateTextInput(this.value, 'scale_slider');"></div>
        <div>Detector Model</div>
		<div>
			<select id="model_version" autocomplete="off" name="model_version" > <!-- onchange="refreshInfo();" -->
		 		<option value="vF" selected>Default Detector</option>
		 		<option value="vA">Detector (exp)</option>
		 	</select>
		</div>
		</form>
		<div>Notice</div>
		<div class="small">The detection speed depends on the input size (and the server load). In the case of very large tablets it may take several minutes. Please be patient and scroll to the top to check for the response window!</div>
		<div id="errorFieldDet" style="color:red; text-align:center;"></div>
		</div>
	</div>

	<div class="button statusButton popupButton" onclick="startDetection();">Detect!</div>
	<div class="button statusButton popupButton" onclick="setPopUp();clearScalePattern();errorFieldDet.innerHTML='';">Cancel</div>
</div>

<div id="modelList" class="hoverInfo" style="text-align:center; left: 20%px; top:25%; width:43ch; heigth:45em; padding: 1ch;">
<b>Available Models</b>
<div id="availableModels" style="text-align:left;font-family: monospace;"></div>
	<div class="button statusButton popupButton" onclick="document.getElementById('modelList').style.display = 'none';">Ok</div>
</div>

<div id="matlabStream" class="hoverInfo" style="text-align:center; left: 20em; top:5em; width: 100ch; heigth:45em">
<div class="button" style="display:inline-block;width:7ch;" id="verbose" onclick="streamChange = true;">verbose</div>
<div><textarea id="matlabOutput" rows="40" cols="98" readonly="true" style="resize:none;"></textarea></div>
<div class="smallbox" style="color:green" id="pingLeft"></div><div class="smallbox" style="color:white;" id="pingRight"></div>
	<div class="button statusButton popupButton" style="display:none;" id="closeStream" onclick="setPopUp();loadResults(detectionInfo.ID);">Ok</div>
</div>

<div id="retrainPopUp" class="hoverInfo" style="text-align:center; left: 20%px; top:25%; heigth:45em; padding: 1ch;">
	<h2>Retrain</h2>
	The following signs will be retrained:<br />
	<div id='retrainData'></div>
	Please choose the Annotations to be used:<br />
	<b>Available Annotations</b>
<form id="availableAnnotations">
<table style="margin:auto; border:hidden">
<tr>
	<?php
$archiveJSON = file_get_contents($_SESSION['cuneidemo']['groupFolder']."archivedAnnotations.json");
$archive = json_decode($archiveJSON,true);

$collectionNames = $archive['collections'];

//$xmlImages = simplexml_load_file($_SESSION['cuneidemo']['imagesPath'].'imagesList.xml');
$counter = 0;
foreach($archive['images'] as $group => $images)
		{
				echo "<th colspan=\"6\">$collectionNames[$group]</th></tr><tr>";
				//$statusAnnotations = $imageInfo->annotation['info'];

				foreach($images as $key=>$annotation)
				{
					echo "<td style='border:none;'><label style='white-space:nowrap; display:inline-block;vertical-align:middle; margin-top:0.5em;'>
					<input type='checkbox' value=$group name=$key checked=true style='width:1.5em;vertical-align:middle'/>$annotation </label></td>";
					$counter++;
					if( ($counter % 3) == 0)
					{
						echo '</tr><tr>';
					}
				}
				for (;($counter % 3) != 0; $counter++)
				{	echo "<td></td>";
				}
				echo '</tr><tr>';

}


?>
</tr>
</table>
</form>
<!-- 	<div style="text-align:center;font-family: monospace;">
	<form action="" id="availableAnnotations"></form>
	</div>-->
	<div class="button statusButton popupButton" style="display:none;" id="startRetrain" onclick="startRetrain();">Retrain</div>
	<div class="button statusButton popupButton"  onclick="setPopUp();">Cancel</div>
</div>

<div id="updateDictionary" class="hoverInfo" style="position:absolute; text-align:center; left: 20%; top:25%; width:43ch; heigth:45em; padding: 1ch;">
<h3>Update labels' dictionary</h3>
<div style="text-align: left;">
You entered a name that isn't in the database. <br />
Please enter the corresponding numbering for this test label and press ok or click cancel to re-enter the label.
<div class="small" style="text-align: center;"><br />Only english alphanumeric, no spaces!</div>
</div>

	Entered Label: <b><div id="enteredLabel"></div></b>
	<div id="actualLabel"></div>
	<form autocomplete="off">ID:<input type="text" id="dictionaryEdit" value=""></form>

	<div id="dictWarning" style="color:red; text-align:center; display:none;"></div>
	<div class="button statusButton" onclick="openDictionary();">Dictionary</div><br />
	<div class="button statusButton popupButton" onclick="dictionaryUpdate();">Save</div>
	<div class="button statusButton popupButton" onclick="document.getElementById('updateDictionary').style.display = 'none';
														 document.getElementById('dictWarning').innerHTML = '';
														  document.getElementById('dictionaryEdit').value = '';">Cancel</div><br />
  <!--  <div class="button statusButton popupButton" style="width:'auto';" onclick="dictionaryAuto();">Create Automatically</div>-->
</div>

<div id="metaData" class="hoverInfo" style="text-align:center; left: 20%px; top:10%; width:50ch; padding: 3ch;">
<h3>Meta-Data for Image</h3>
<div class="meta" id="metaForm" style="text-align:left;"></div>
	<div class="button statusButton popupButton" onclick="meta.saveMeta();">Save</div>
	<div class="button statusButton popupButton" onclick="setPopUp();">Cancel</div>
</div>

<div id="searchedTools" class="hoverInfo" style="text-align:center; left: 14em; bottom:10%; top:auto; width:1000px;">
<h3>Searched signs</h3>
<div id="searchedSigns" style="text-align:left;"></div>
<div class="button statusButton popupButton" onclick="updateVisible();">Show Signs</div>
<div id="searchedOptions" style="text-align:center;">
<input id="sliderAdjustSize" type=range min=0 max=1 value=0.95 id="slider" step=".01" oninput="adjustmentUpdate(this.value)" autocomplete="off">
<div id="sliderAdjustVlue">0.95</div>
<div id="buttonAdjustSize" class="button statusButton" onclick="adjustSize(true);">Adjust Size</div>
</div>
	<div class="button statusButton popupButton" onclick="setPopUp();">Cancel</div>
</div>

<div id="generateAnno" class="hoverInfo" style="text-align:center; left: 20%px; top:10%; width:50ch; padding: 3ch;">
This image hasn't got any annotation. <br/>
Do you want to generate an annotation from your feedback?
	<div class="button statusButton popupButton" onclick=" setPopUp(); sendCorrections(true);">Yes</div>
	<div class="button statusButton popupButton" onclick=" setPopUp(); sendCorrections(false);">No</div>
</div>

<div id=testDIV style="width:20em; height:1.75em; overflow:hidden; position:fixed; z-index:4; right:10;top:10;border: 2px solid #a1a1a1;
  border-radius: 10px;background-color:#ffffff;  text-align: center; resize: both;">
    <div id="dictionaryHeader" style="top:0; padding-top:0.2">
        <div id="openCloseDic" style="width:15em; display:inline-block;text-align:center;cursor:default;" >Dictionary
            <div style="display:inline-block; border:1px solid #000000; margin:2px; width:2.25em; height=1em; border-radius:7px; cursor:pointer;" id="toggle" onclick="openDictionary();">&#x25BE;</div>
        </div>
    </div>
    <div id="dictionary" style="overflow:auto; max-height: 50em "></div>
</div>

 <div id="transliteration" class="hoverInfo" style="text-align:center; left: 20%px; top:10%; width:50ch; height: 5ch; display:none;">
<textarea id="transText" rows="4" cols="60"></textarea>
<div id="transTable"></div>
 </div>
<script> offline =false;</script>
<script src="functions/gui.js" type=text/javascript></script>
<script src="functions/cuneiformOOP.js" type=text/javascript></script>

</body>
</html>
