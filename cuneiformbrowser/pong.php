 <?php session_start();
 if($_SESSION['cuneidemo']["enabled"] != true)
 {
	echo json_encode(array("ping"=>"go away"));
 	exit;
 }

echo json_encode(array("ping"=>"pong"));


?>
