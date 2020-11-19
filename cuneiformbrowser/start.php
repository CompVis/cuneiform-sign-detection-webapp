<?php
/////////////////////////////////////
//  Run-time SESSION variables:
/*
$_SESSION['cuneidemo']['enabled']
$_SESSION['cuneidemo']['user']
$_SESSION['cuneidemo']['collection']
$_SESSION['cuneidemo']['group']
$_SESSION['cuneidemo']['imagesPath']
$_SESSION['cuneidemo']['imagesList']
$_SESSION['cuneidemo']['annotationsPath']
$_SESSION['cuneidemo']['groupModels']
$_SESSION['cuneidemo']['groupFolder']

$_SESSION['cuneidemo']['groupName']
$_SESSION['cuneidemo']['collectionName']
$_SESSION['cuneidemo']['autoload']
$_SESSION['cuneidemo']['loadBackup']
$_SESSION['cuneidemo']['continueProcess']

$_SESSION['cuneidemo']['verboseFile']
$_SESSION['cuneidemo']['backupData']
 */

	// Call session manager and check if a user is logged in
	include_once('sessionManagement.php');

	// now check if a particular group/collection has been called

if(isset($_GET['collection']))
	{
			//$xmlData = simplexml_load_file('data/dataconfig.xml');
			$dataconfig = json_decode(file_get_contents('data/dataconfig.json'),true);
			$_SESSION['cuneidemo']['collection'] = $_GET['collection'];
			$_SESSION['cuneidemo']['group'] = $_GET['group'];

			$groupFolder = $dataconfig["groups"][intval($_GET['group'])]["groupFolder"];
			//$groupFolder = $xmlData->group[intval($_GET['group'])]->folder.DIRECTORY_SEPARATOR;

			//$collection = $xmlData->group[intval($_GET['group'])]->collections->collection[intval($_GET['collection'])]->folder.DIRECTORY_SEPARATOR;
			$collection = $dataconfig["groups"][intval($_GET['group'])]["collections"][intval($_GET['collection'])]["collectionFolder"];
			$_SESSION['cuneidemo']['collectionFolder'] = 'data/'.$groupFolder.$collection;
			$_SESSION['cuneidemo']['imagesPath'] = 'data/'.$groupFolder.$collection.'images'.DIRECTORY_SEPARATOR;
			//$_SESSION['cuneidemo']['imagesPath'] = 'data/'.$groupFolder.$collection;
			$_SESSION['cuneidemo']['imagesList'] = 'data/'.$groupFolder.$collection.'imagesList.xml';
			$_SESSION['cuneidemo']['annotationsPath'] = 'data/'.$groupFolder.$collection.'annotations'.DIRECTORY_SEPARATOR;
			$_SESSION['cuneidemo']['groupModels'] = 'data/'.$groupFolder.'models/';
			$_SESSION['cuneidemo']['groupFolder'] = 'data/'.$groupFolder;

			//$_SESSION['cuneidemo']['groupName'] = (string) $xmlData->group[intval($_GET['group'])]->name;
			$_SESSION['cuneidemo']['groupName'] =  $dataconfig["groups"][intval($_GET['group'])]["groupName"];

			//$_SESSION['cuneidemo']['collectionName'] = (string) $xmlData->group[intval($_GET['group'])]->collections->collection[intval($_GET['collection'])]->name;
			$_SESSION['cuneidemo']['collectionName'] =  $dataconfig["groups"][intval($_GET['group'])]["collections"][intval($_GET['collection'])]["collectionName"];
			$_SESSION['cuneidemo']["performance"] = $_SESSION['cuneidemo']['groupFolder']."performance".DIRECTORY_SEPARATOR;
			$_SESSION['cuneidemo']['collectionFolderName'] = $collection;

	}else
	{
		$dataconfig = json_decode(file_get_contents('data/dataconfig.json'),true);
		//$xmlData = simplexml_load_file('data/dataconfig.xml');
		$_SESSION['cuneidemo']['groupName'] = "Select Group";
		$_SESSION['cuneidemo']['collectionName'] = "Select Collection";
	}

	include_once('config.php');
//	include("./startxml.php");

	$_SESSION['cuneidemo']['autoload'] = false;
	$_SESSION['cuneidemo']['loadBackup'] = false;
	$_SESSION['cuneidemo']['continueProcess'] = false;
?>
<html>
<head>
<link rel="stylesheet" type="text/css" href="styleStart.css">
<title>Entry level</title>
<script src="/lib/jquery.min.js"></script>
</head>
<body>
	<div id="groupSelection" class="root">
		<div style="text-align:center;">
			<div id='groupButton' class="buttonNormal" style="margin-top:1em;" onclick="select();"><?php echo $_SESSION['cuneidemo']['groupName']?></div>
			<div id='collectionButton' class="buttonNormal" style="margin-top:1em;" onclick="collectionSelect();"><?php echo $_SESSION['cuneidemo']['collectionName']?></div>
			<div id='helpButton' class="buttonNormal" style="margin-top:1em;" onclick="setPopUp('popUpHelp');">Help</div>
		</div>
	</div>

	<br />
	<div>
	<div id="options" class="root">
	<div class="smallbox" id="ping" style="background-color:green; float:right; transform: translateY(+50%); position:relative; top:50%;right:0.5em;"></div>
	<h1> Select one option</h1>

	<div style="text-align:center;">

	<div id='galleryButton' class="buttonNormal" onclick="changeDiv('gallery');">Select Image</div>
	<div id='uploadButton' class="buttonNormal" onclick="changeDiv('upload');">Upload Image</div>
	<!-- <div id='trainButton' class="buttonNormal" onclick="changeDiv('train');">Train Model(s)</div>-->
<!-- 	<div class="buttonNormal" value="Group" onclick="window.location='groupTools.php';">Group Tools</div> -->
<!--	<div class="buttonNormal" value="Group" onclick=" window.open('groupTools.php', 'Group Tools'); win.focus();">Group Tools</div> -->
	<div class="buttonNormal disabled" value="Group" onclick="">Group Tools</div>
	<div id='otherButton' class="buttonNormal disabled" onclick="">Miscellaneous</div>
	<?php
	$backup = startingCheck();

 		if($backup['process'])
 				if($backup['type'] == 'DETECTION')
 			    	echo '<div id="continueDetectionButton" class="buttonNormal" onclick="changeDiv(\'continueDetection\');">Detection Stream</div>';
 			    else
 					echo '<div id="continueTrainingButton" class="buttonNormal" onclick="changeDiv(\'continueTraining\');">Training Stream</div>';
 		elseif ($backup['backup'])
 		  		echo '<div id="continueButton" class="buttonNormal" onclick="changeDiv(\'continue\');">Detection Results</div>';
		?>
	</div>

	</div>

<div id="gallery" class="gallery" style="display:none;"  ><h2> Select one image </h2>
						Click on the image to load the image without annotations<br />
				Click on "(partially) annotated" to load the annotations with the image<br />
				<div id=tableContent></div>
				<div id=pages></div>

</div>

			<div id="upload" class="gallery" style="display:none;" >
			<form action="uploadPicture.php" method="post" enctype="multipart/form-data">
				<label for="file">Image source:</label>
			    <input type="file" name="imageUploaded"><br>
				Name or Catalog Number: <input type="text" name="catalog"><br />
						<input type="checkbox" id="editor" name="Editor" checked="true" /> Open in editor
					<input type="submit" value="Submit"><br />
				</form>
			</div>





	<div id="matlabStream" class="gallery" style="padding:1em;display:none;">
		<div class="buttonNormal" style="display:inline-block;width:7ch;" id="verbose" onclick="streamChange = true;">verbose</div>
		<div><textarea id="matlabOutput" rows="40" cols="98" readonly="true" style="resize:none;"></textarea></div>
		<div class="smallbox" style="color:green"; id="pingLeft"></div><div class="smallbox" style="color:white;" id="pingRight"></div>
		<div class="button statusButton popupButton" style="display:none;" id="closeStream" onclick="loadResults();">Ok</div>
	</div>
<div id="train"   style="display:none;padding:1em;">
		<div id="trainMenu" class="root" >
	<h1> Training interface</h1>

Please Type in the textfield which signs you want to train, separated by commas.<br />
Afterwards, select the annotations you want to use to that end (default: all) and click "ok" or press ENTER <br/>
Note that only <b>archived</b> annotations are shown!<br />
</div>

<div style="text-align:center;">
<form autocomplete="off" ><input type="text" id="targetNumbers" value=""><div id="ok" class="buttonNormal" style="margin-left:1em;margin-top:auto;margin-bottom:auto;" onclick="startTraining();">Train!</div><br /> <div id="errorField" style="color:red;"></div>
<input type='checkbox' value='retrain' id='reTrainFlag' checked=true style='width:1.5em;vertical-align:middle'/>Re-train the selected signs<br />
<div class="gallery" style="display:none;">
<b>Methods to be (re-)trained:</b><br /><br />
<input type='checkbox' value='retrain' id='HOG' checked=true style='width:1.5em;vertical-align:middle'/>General HOG model<br />
<input type='checkbox' value='retrain' id='SIFT' checked=false style='width:1.5em;vertical-align:middle'/>Dense SIFT
<input type='checkbox' value='retrain' id='Wedges' checked=false style='width:1.5em;vertical-align:middle'/>Wedge Model
<input type='checkbox' value='retrain' id='MultiClass' checked=false style='width:1.5em;vertical-align:middle'/>Multi-Class Classifier<br />
</div>
</form>
<b>Note</b>: if you don't check retrain, the models will be <u><i>overwritten</i></u>!!!
</div>

<div class="gallery">
<form id="annotationsForm">
<table style="margin:auto;">
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
					echo "<td><label style='white-space:nowrap; display:inline-block;vertical-align:middle; margin-top:0.5em;'>
					<input type='checkbox' value=$group id=$key name='annotations' checked=true style='width:1.5em;vertical-align:middle'/>$annotation </label></td>";
					$counter++;
					if( ($counter % 6) == 0)
					{
						echo '</tr><tr>';
					}
				}
				for (;($counter % 6) != 0; $counter++)
				{	echo "<td></td>";
				}
				echo '</tr><tr>';

}


?></tr>
</table>
</form>
</div>
</div>

			<div id="continue" class="gallery" style="display:none;padding:1em;" >
				<b>You have stored a detection with non-sent uncomplete feedback.</b><br/><br/>
				Do you want to continue correcting?<br/>
				(Please note: starting a new detection will erase this backup without sending any feedback!)<br /><br />
				<div class="buttonNormal" onclick="loadBackup();">Continue Feedback</div>
			</div>
			<div id="continueDetection" class="gallery" style="display:none;padding:1em;" >
				<b>A detection call is running or finished</b><br/><br/>
				Do you want to open the detection stream/results?<br/>
				<br /><br />
				<div class="buttonNormal" onclick="openDetection();">Open Detection Stream</div>
			</div>
			<div id="continueTraining" class="gallery" style="display:none;padding:1em;" >
				<b>A training call is running or finished</b><br/><br/>
				Do you want to open the training stream?<br/>
				<br /><br />
				<div class="buttonNormal" onclick="openTraining();">Open Training Stream</div>
			</div>

</div>
</div>
<div class="signEdit popUp" id="popGroup">
	<div class="popText">
		<h3 style="text-align:center;">Select Group</h3>
		<div style="text-align:right"> <div class="buttonNormal" value="Group" onclick="popUpNew('Group');">New Group</div> </div>
		<table>		<?php
			$counter = 0;
			foreach($dataconfig["groups"] as $group)
			{
					$id = $counter;
					$name = $group["groupName"];
					echo "<td><div value=$id class=\"buttonNormal\" style=\"margin-top:1em;\" onclick=\"groupSelect(this);\">$name</div></td>";
					$counter++;

					if( ($counter % 6) == 0)
					{
						echo '</tr><tr>';
					}


			}

			for (;($counter % 6) != 0; $counter++)
			{	echo "<td></td>";
			}
		?></tr>
		</table>

	</div>
	<div class="buttonNormal" onclick="cancelSelection();">Cancel</div>
</div>

<div class="signEdit popUp" id="popNew">
	<div class="popText new">
		<h3 style="text-align:center;" id="new" >New Group</h3>

		<form>
		<p>
			<label for "long" id="newLong">New Group's Name:</label>
			<input type="text" id="long" name="newName">
		</p>
		<p>
			<label for "short" id="newShort">New Group's Directory:</label>
			<input type="text" id="short" name="shortName">
		</p>
		</form>
	</div>
	<div id="errorFieldNew" style="color:red; text-align:center;"></div>
	<div class="buttonNormal" onclick="createNew();">Submit</div>
	<div class="buttonNormal" onclick="cancelSelection();">Cancel</div>
</div>


<div class="signEdit popUp" id="popCollection">
	<div class="popText">
		<h3 style="text-align:center;">Select Collection</h3>
		<!-- <div class="buttonNormal" value="Group" onclick="" style="float:left">Group Tools</div> -->
		<div class="buttonNormal" value="Collection" onclick="popUpNew('Collection');" style="float:right">New Collection</div>
			<div id=collectionList>
			</div>
	</div>
<!-- 	<hr>
	<div id='trainButton' class="buttonNormal" onclick="changeDiv('train');">Train Model(s)</div>
	<hr> -->
	<div class="buttonNormal" onclick="cancelSelection();">Cancel</div>
</div>
<div id="popUpHelp" class="hoverInfo" style="text-align:center;z-index: 2; position: absolute; top: 10%; left: 15%;">
<div id="popuptext" class="popText">
<h3 style="text-align:center;">General Help</h3>
To close any window, click "ok"/"cancel" or press <b>ESC</b> <br />
<br />
<div style="text-align: left;">
This is the main entry-point to the Web-Editor<br />
To be able to access any function, you have to first choose an image Group and a Collection by clicking on <i>Select Group</i> <br />
Once in a collection, you will have three options (or four, see below):<br /><br />
<div id="generalHelp">
<div class="center"><div class="buttonNormal">Select Image</div><div class="buttonNormal">Upload Image</div></div>
<br/>
<div class="center"><div class="buttonNormal">Select Image</div></div>
This will open a gallery of all the images of the given collection. <br />
Click on an image to load it on the editor, click on the button with the annotations' status to open the image with its annotations loaded. <br />
For non-archived annotations, you have the option to erase the image (an its annotations) by clicking on the small red cross near the thumbnail.
<br /><br />
<div class="center"><div class="buttonNormal">Upload Image</div></div>
This tab will enable you to upload new images to the collection. You will have to give them a new name (<i>only</i> alphanumeric characters!)<br />
<b>Important</b>: <i>only</i> JPEG and PNG images are processed correctly.

<br />
<br />
For more information, you can always download the quick starter guides (annotation <a href="functions/AnnotationQuickGuide.pdf" download><img src="functions/AdobePDF.png" /></a>).
</div></div>
</div>
<div class="button statusButton popupButton" onclick="setPopUp();" style="background-color:white; ">Ok</div></div>


<script> <?php if(isset($_GET['selection']))
				echo "var sel =true;";
			   else
			   	echo "var sel= false;";

			   if(isset($_GET['group']))
			   {
			   		echo 'var groupID = '.$_GET['group'];
			   		echo ";var groupName =  \"".$_SESSION['cuneidemo']['groupName']."\";";
			   		echo 'var collectionID = '.$_GET['collection'];
			   		echo ";var collectionName =  \"".$_SESSION['cuneidemo']['collectionName']."\";";
			   }else
			   {
			   	echo 'var groupID =null;
					  var groupName = null;
				      var collectionID = null;
				      var collectionName = null;';
			   }

			   if(isset($_GET['page']))
			   		echo "var currentPage = \"$_GET[page]\";";
			   else
			   		echo 'var currentPage = "0";';
			   	?></script>

<script src="functions/trainer.js"></script>
</body>
</html>
