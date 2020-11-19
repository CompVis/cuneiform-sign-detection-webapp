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
include_once('logger.php');

$dictionaryJSON = file_get_contents($_SESSION['cuneidemo']['groupFolder']."dictionary.json");
$dictionary = json_decode($dictionaryJSON,true);
ksort($dictionary);

$largeArraySize = 0;
foreach($dictionary as $array) {
	if(count($array) > $largeArraySize) {
		$largeArraySize = count($array);
	}
}
//$largeArraySize -= 1;

?>

<table id="dictionary" style="margin-top:1em;" >
  <tr>
    <th>ID</th>
    <th>Thumbnail</th>
    <th>Sign</th>
    <th>Name</th>
    <th colspan="<?php echo $largeArraySize?>" id="header">Readings</th>
  </tr>
  <?php
  $counter = 1;

 // $size = count($dictionary);
$size = 1000;

  for ($i = 1; $i<= $size; $i++)
  {
  	if(!array_key_exists(sprintf("%03d", $i),$dictionary))
  	{
  		$a = sprintf('%03d', $i);
  		$dictionary[$a] = Array('?');
  		//$size = $size+1;
  	}
  }
  ksort($dictionary);

  foreach($dictionary as $key =>$list)
  {
  	$print = TRUE;
  	$images = glob($_SESSION['cuneidemo']['groupModels'].'examples'.DIRECTORY_SEPARATOR.sprintf("model%03d_*",$key));
  	$s = count($images);
    if(file_exists($_SESSION['cuneidemo']['groupFolder']."sign_thumbs/".sprintf("%03d", $key)."/cunei_000000.jpg")){
        $file = $_SESSION['cuneidemo']['groupFolder']."sign_thumbs/".sprintf("%03d", $key)."/cunei_000000.jpg";
        $class = "yesModel";
    }
  	/*elseif(file_exists($_SESSION['cuneidemo']['groupModels']."modelThumb/thumb_".sprintf("%03d", $key)."_model001.jpg"))
  	{
  		$file = $_SESSION['cuneidemo']['groupModels']."modelThumb/thumb_".sprintf("%03d", $key)."_model001.jpg";
  		$class = "yesModel";
  	}
  	elseif(file_exists($_SESSION['cuneidemo']['groupModels']."modelThumb/thumbBack_".sprintf("%03d", $key).".jpg"))
  	{
  		$file = $_SESSION['cuneidemo']['groupModels']."modelThumb/thumbBack_".sprintf("%03d", $key).".jpg";
  		$class ="noModel";
  	}*/
  	elseif($s != 0)
  	{
  		$file = $images[0];
  		$class ="noModel";
  	}
  	elseif($list[0] != "?")
  	{
  		//$print = FALSE;
  		$file = "";
  		$class ="noModel";
  	}else
  	{
  		$print = FALSE;
  	}
  	if($print)
  	{
	echo "<tr id=\"row$key\"> <td class =$class colID=\"-1\">$key</td>";
        echo "<td name=\"image\"><img src=\"$file\" /*ondblclick=\"openImagesList(this);\"*/  alt=\"$list[0]\" name=\"image\"></img></td>";
	// remove first entry from list
	$uni_sign = array_splice($list,1,1);
    if(count($uni_sign) == 0)
        $uni_sign = "N/A";
    else
        $uni_sign = $uni_sign[0];

	echo "<td name=\"unicode\">$uni_sign</td>";

  	$t = 0;
  	foreach($list as $i=>$name)
  		{
  		for ($j=0; $j<10; $j++)
  		{
  			$name = str_replace("$j","*".$j, $name);

  		}
  		for ($j=0; $j<10; $j++)
  		{
  			$name = str_replace("*$j","&#832".$j, $name);
  		}

  		$name = str_replace("sz","&#353", $name);
  		$name = str_replace("SZ","&#352", $name);
  		$name = str_replace("t,","&#7789", $name);
  		$name = str_replace("T,","&#7788", $name);
  		$name = str_replace("s,","&#7779", $name);
  		$name = str_replace("S,","&#7778", $name);
  		$name = str_replace("h","&#7723", $name);
  		$name = str_replace("H","&#7722", $name);
  		$name = str_replace("S'","Ś", $name);
  		$name = str_replace("s'","ś", $name);
  		$name = str_replace("'","ʾ",$name);

		if($i==0)
  			echo "<td rowID=$key colID=$i name\"$key\"=>$list[0]</td>";  //$name

		$t = $i+1;
		echo "<td rowID=$key colID=$t name\"$key\"=>$name</td>";

  		}
  	echo '</tr>';
  	}
  }

  ?>

</table>
