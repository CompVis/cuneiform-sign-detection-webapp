<?php
if(session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}
if($_SESSION['cuneidemo']["enabled"] != true)
{
	echo "nope!";
	exit;
}
include_once('config.php'); // Needed for the different Folders

if(isset($_GET['page']))
{
	$_SESSION['cuneidemo']['page'] = $_GET['page'];
	loadIndex($_GET['page']);
}
else
{
	$_SESSION['cuneidemo']['page'] = 0;
	loadIndex(0);
}

function loadIndex($page)
{
	/* This should load an index of all the tablets
	 * 	- Thumbnail of the images (pre-generated?)
	* 	- Does it have annotations?
	* 	- Name input
	*/

	$xmlImages = simplexml_load_file($_SESSION['cuneidemo']['imagesList']);
	$totalPages = ceil($xmlImages->total / _PAGESIZE_);
	$counter = $page*_PAGESIZE_;
	$endLoop = (($page+1)*_PAGESIZE_ > $xmlImages->total)? $xmlImages->total :	($page+1)*_PAGESIZE_;
	// check if there are _any_ images!
	if($xmlImages->total != 0)
	{
		echo '<table style="margin:auto;"><tr>';
		for($i = $page*_PAGESIZE_; $i < $endLoop; $i++)
		{
			$imageInfo =$xmlImages->image[$i];
			$id = $counter;
			$name = $imageInfo->name;
			$file = $imageInfo->file;
			$type = $imageInfo->name['type'];
			$size =  round(filesize($_SESSION['cuneidemo']['imagesPath']."$file.jpg")/(1024*1024),1);
			//$image = $_SESSION['cuneidemo']['imagesPath'].'images'.DIRECTORY_SEPARATOR."$file";
			$thumb = $_SESSION['cuneidemo']['collectionFolder'].'thumbs'.DIRECTORY_SEPARATOR."$file-thumb.jpg";
			//$thumb = $_SESSION['cuneidemo']['collectionFolder']."$file-thumb.jpg";
			// 				if ($type=="front")
			// 				{
			// 					$name = $name."Vs";
			// 				}
			// 				else
			// 				{
			// 					$name = $name."Rs";
			// 				}

			if($imageInfo->annotation["info"] == "none")
			{
				$trash = '<div class="trash" onclick="removeImage('.$id.');"></div>';

				$annotation = '<div class="button no">Not Annotated</div>';
			}
			elseif ($imageInfo->annotation["info"] == "partial")
			{
				$trash = '<div class="trash" onclick="removeImage('.$id.');"></div>';
				$annotation = "<a href=\"editor.php?image=$id&annotation=true&page=$page\"> <div class=\"button almost\">Partially Annotated</div> </a>";
			}
			else
			{
				$trash = "";
				$annotation = "<a href=\"editor.php?image=$id&annotation=true&page=$page\"> <div class=\"button\">Annotated</div> </a>";
			}

			echo'<td><div class=thumbnail>'.$trash.'<div style="height:272px; display:table-cell;vertical-align: middle">';
			echo "<a href=\"editor.php?image=$id&group=".$_SESSION['cuneidemo']['group']."&collection=".$_SESSION['cuneidemo']['collection']."&annotation=false&page=$page\"> <img class='preview-image' src=\"$thumb\"> </a></div>";
			echo "$name <br />[$size Mb]<br /> $annotation</div></td>";

			$counter++;
			if( ($counter % 5) == 0)
			{
			echo '</tr><tr>';
			}

		}

			for (;($counter % 5) != 0; $counter++)
			{	echo "<td></td>";
			}
			echo '</tr></table>';/*<div id=pages onclick=changePage; value="0">';
				for ($i = 0; $i < $totalPages; $i++)
				{
				$number = $i+1;
					if ($number == 1)
						echo '<div class="helpButton buttonNormal statusSelected" value='.$number.'>'.$number.'</div>';
					else
						echo '<div class="helpButton buttonNormal" value='.$number.'>'.$number.'</div>';
				}
				echo '</div></div>';*/
			} else
				echo '<h2> No images in this collection! </h2><br />Consider uploading some images first!';

		}


?>