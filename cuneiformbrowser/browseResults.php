<?php
if(session_status() !== PHP_SESSION_ACTIVE) {
	session_start();
}
if($_SESSION['cuneidemo']["enabled"] != true)
{
	echo "nope!";
	exit;
}
include_once('config.php');

?>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Results browser</title>
<link rel="stylesheet" type="text/css" href="styleEditor.css">
<script src="lib/jquery.min.js"></script>
</head>
<body>
<h2></h2>
<div id="confusion" style="float:left; margin-right:2em">
<svg id="svgMaster"></svg>
<div id="tooltip" ></div>
</div>

<div id=Annotations style="float:left">
<?php
$mainInfo = json_decode(file_get_contents($_SESSION['cuneidemo']["performance"]."mainIndex.json"),true);
$trainingData = json_decode(file_get_contents($_SESSION['cuneidemo']["groupFolder"]."archivedAnnotations.json"),true);
$lastTrain = intval(end($mainInfo["trainingIDs"]));
$current = intval($mainInfo["currentID"]);
$annotations = Array();
$numCollections = count($trainingData["images"]);

for($i = 0; $i < $numCollections; $i++)
{
	foreach($trainingData["images"][$i] as $name)
		$annotations[$name] = Array("Train" => true, "Feedback"=> false);
}
// "detected":"20","correct":19,"falsePositive":0,"falseDetection":1,"threshhold":"0.3"
for($i = $lastTrain+1; $i <= $current; $i++)
{
	$info = json_decode(file_get_contents($_SESSION['cuneidemo']["performance"]."statsGeneral".DIRECTORY_SEPARATOR.sprintf("%'.010d.json",$i)),true);

	if(array_key_exists("FeedbackData",$info))
	{
		$name = substr($info["image"],0,-4);
		if(array_key_exists($name,$annotations))
			$train = true;
		else
			$train = false;

		$annotations[$name] = Array("Train" => $train, "Feedback"=> true, "detected"=> $info["FeedbackData"]["detected"], "correct"=>$info["FeedbackData"]["correct"],"threshhold"=>$info["FeedbackData"]["threshhold"]);


	}
}
?>
<table>
	<tr>
		<th>Image</th><th>Set</th><th>Feedback</th><th>Detected</th><th>Correct</th><th>Thresh</th>
	</tr>
		<?php
		$totalDet = 0;
		$totalCor = 0;

		foreach($annotations as $name=>$info)
		{
			if($info["Train"])
				$part1 = "<td class=\"yesModel\">train</td>";
			else
				$part1 = "<td class=\"noModel\">test</td>";

			if($info["Feedback"])
			{
				$part2 = "<td class=\"yesModel\">yes</td><td>$info[detected]</td><td>$info[correct]</td><td>$info[threshhold]</td>";
				$totalDet += $info["detected"];
				$totalCor +=  $info["correct"];
			}
			else
				$part2 = "<td>no</td><td>-</td><td>-</td><td>-</td>";

			echo "<tr><td>$name</td>$part1$part2</tr>";

		}
		echo "<td>Total</td><td>-</td><td>-</td><td>$totalDet</td><td>$totalCor</td><td>-</td>"
		?>


</table>
</div>
<script src="functions/resultsBrowser.js"> </script>
</body>

</html>